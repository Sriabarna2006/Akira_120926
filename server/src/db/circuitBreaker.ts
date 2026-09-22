import { CircuitBreakerState, DatabaseErrorClassification } from '../types/index.js';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxProbes: number;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalCalls: number;
  totalFailures: number;
  totalCircuitBreaks: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  lastErrorType: DatabaseErrorClassification;
  lastErrorMessage: string | null;
  resetTimeoutMs: number;
}

export class DatabaseCircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalCircuitBreaks = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastErrorType: DatabaseErrorClassification = DatabaseErrorClassification.NETWORK_FAILURE;
  private lastErrorMessage: string | null = null;

  private readonly config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      resetTimeoutMs: config?.resetTimeoutMs ?? 15000,
      halfOpenMaxProbes: config?.halfOpenMaxProbes ?? 2,
    };
  }

  /**
   * Determine if an operation can proceed against the primary database
   */
  public canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
      case CircuitBreakerState.FAILURES:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.lastFailureTime && now - this.lastFailureTime >= this.config.resetTimeoutMs) {
          this.state = CircuitBreakerState.HALF_OPEN;
          this.consecutiveSuccesses = 0;
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful execution
   */
  public recordSuccess(): void {
    this.totalCalls++;
    this.lastSuccessTime = Date.now();
    this.consecutiveFailures = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.config.halfOpenMaxProbes) {
        this.state = CircuitBreakerState.CLOSED;
      }
    } else if (this.state === CircuitBreakerState.FAILURES) {
      this.state = CircuitBreakerState.CLOSED;
    }
  }

  /**
   * Record a failed execution with error classification
   */
  public recordFailure(err: unknown): DatabaseErrorClassification {
    this.totalCalls++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;

    const classification = this.classifyError(err);
    this.lastErrorType = classification;
    this.lastErrorMessage = err instanceof Error ? err.message : String(err);

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Immediate reversion to OPEN if a probe fails
      this.state = CircuitBreakerState.OPEN;
      this.totalCircuitBreaks++;
    } else if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.totalCircuitBreaks++;
    } else {
      this.state = CircuitBreakerState.FAILURES;
    }

    return classification;
  }

  /**
   * Classify Postgres or network errors into standard classifications
   */
  public classifyError(err: unknown): DatabaseErrorClassification {
    if (!err) return DatabaseErrorClassification.QUERY_FAILURE;

    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as any).code) : '';

    // Network / Connection Failures
    if (
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('timeout') ||
      msg.includes('connection terminated') ||
      msg.includes('client has been closed') ||
      code === '57P01' || // admin_shutdown
      code === '57P02' || // crash_shutdown
      code === '57P03'    // cannot_connect_now
    ) {
      return DatabaseErrorClassification.NETWORK_FAILURE;
    }

    // Schema Failures (Undefined column or relation)
    if (code === '42703' || code === '42P01' || msg.includes('does not exist')) {
      return DatabaseErrorClassification.SCHEMA_FAILURE;
    }

    // Constraint Violations (Foreign key, Unique constraint)
    if (code === '23503' || code === '23505' || msg.includes('foreign key') || msg.includes('unique constraint')) {
      return DatabaseErrorClassification.CONSTRAINT_FAILURE;
    }

    // Validation Failures (Invalid text representation, check constraint)
    if (code === '22P02' || code === '23514' || msg.includes('invalid input syntax') || msg.includes('check constraint')) {
      return DatabaseErrorClassification.VALIDATION_FAILURE;
    }

    return DatabaseErrorClassification.QUERY_FAILURE;
  }

  /**
   * Reset the circuit breaker to pristine CLOSED state
   */
  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastErrorMessage = null;
  }

  /**
   * Force state for testing or administrative override
   */
  public forceState(state: CircuitBreakerState): void {
    this.state = state;
    if (state === CircuitBreakerState.OPEN) {
      this.lastFailureTime = Date.now();
    }
  }

  /**
   * Get current state
   */
  public getState(): CircuitBreakerState {
    // If OPEN but reset timeout passed, virtual state is HALF_OPEN
    if (this.state === CircuitBreakerState.OPEN && this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
      return CircuitBreakerState.HALF_OPEN;
    }
    return this.state;
  }

  /**
   * Get complete stats snapshot
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalCircuitBreaks: this.totalCircuitBreaks,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastErrorType: this.lastErrorType,
      lastErrorMessage: this.lastErrorMessage,
      resetTimeoutMs: this.config.resetTimeoutMs,
    };
  }
}

export const dbCircuitBreaker = new DatabaseCircuitBreaker();
