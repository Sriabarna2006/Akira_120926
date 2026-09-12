import { Request, Response } from 'express';
import { supabaseAdmin, checkDatabaseConnection, isSupabaseConfigured } from '../db/supabase.js';

// In-memory fallback profile store for offline/development mode
interface LocalProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  savedEvents: string[];
  interests: string[];
  createdAt: string;
}

const localProfiles = new Map<string, LocalProfile>();

export class AuthController {
  /**
   * GET /api/health/db
   * Tests Supabase/PostgreSQL connection health.
   */
  static async checkDbHealth(req: Request, res: Response): Promise<void> {
    const health = await checkDatabaseConnection();
    res.json(health);
  }

  /**
   * GET /api/auth/profile
   * Returns current authenticated user's profile.
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user session.' });
      return;
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Table or query error
          console.warn('[AuthController] Supabase profile fetch error:', error.message);
        }

        if (profile) {
          res.json({
            id: profile.id,
            email: profile.email || user.email,
            displayName: profile.display_name || user.email?.split('@')[0] || 'Explorer',
            role: profile.role || user.role,
            avatarUrl: profile.avatar_url,
            createdAt: profile.created_at,
          });
          return;
        }
      } catch (err) {
        console.warn('[AuthController] Database query error:', (err as Error).message);
      }
    }

    // Development/offline fallback
    let local = localProfiles.get(user.id);
    if (!local) {
      local = {
        id: user.id,
        email: user.email || 'user@akira.ai',
        displayName: user.email?.split('@')[0] || 'AKIRA Explorer',
        role: user.role,
        savedEvents: [],
        interests: ['technology', 'science', 'economy'],
        createdAt: new Date().toISOString(),
      };
      localProfiles.set(user.id, local);
    }

    res.json({
      id: local.id,
      email: local.email,
      displayName: local.displayName,
      role: local.role,
      interests: local.interests,
      createdAt: local.createdAt,
      source: 'local_fallback',
    });
  }

  /**
   * POST /api/auth/profile
   * Updates user display name and metadata.
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { displayName, interests } = req.body;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          res.json({ success: true, profile: data });
          return;
        }
      } catch (err) {
        console.warn('[AuthController] Profile upsert error:', (err as Error).message);
      }
    }

    // Local fallback
    let local = localProfiles.get(user.id);
    if (!local) {
      local = {
        id: user.id,
        email: user.email || 'user@akira.ai',
        displayName: displayName || 'AKIRA Explorer',
        role: user.role,
        savedEvents: [],
        interests: interests || ['technology'],
        createdAt: new Date().toISOString(),
      };
    } else {
      if (displayName) local.displayName = displayName;
      if (interests) local.interests = interests;
    }
    localProfiles.set(user.id, local);

    res.json({ success: true, profile: local });
  }

  /**
   * GET /api/auth/saved-events
   * Returns user's saved events.
   */
  static async getSavedEvents(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('saved_events')
          .select('event_id, saved_at, notes')
          .eq('user_id', user.id);

        if (!error && data) {
          res.json({ success: true, savedEvents: data });
          return;
        }
      } catch (err) {
        console.warn('[AuthController] Saved events fetch error:', (err as Error).message);
      }
    }

    const local = localProfiles.get(user.id);
    res.json({ success: true, savedEvents: local?.savedEvents || [] });
  }

  /**
   * POST /api/auth/saved-events
   * Saves an event for the user.
   */
  static async saveEvent(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { eventId, notes } = req.body;
    if (!eventId) {
      res.status(400).json({ error: 'eventId is required' });
      return;
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('saved_events').upsert({
          user_id: user.id,
          event_id: eventId,
          notes: notes || null,
          saved_at: new Date().toISOString(),
        });

        if (!error) {
          res.json({ success: true, message: 'Event saved successfully' });
          return;
        }
      } catch (err) {
        console.warn('[AuthController] Save event error:', (err as Error).message);
      }
    }

    // Local fallback
    let local = localProfiles.get(user.id);
    if (!local) {
      local = {
        id: user.id,
        email: user.email || 'user@akira.ai',
        displayName: 'Explorer',
        role: user.role,
        savedEvents: [],
        interests: [],
        createdAt: new Date().toISOString(),
      };
      localProfiles.set(user.id, local);
    }
    if (!local.savedEvents.includes(eventId)) {
      local.savedEvents.push(eventId);
    }

    res.json({ success: true, message: 'Event saved successfully', savedEvents: local.savedEvents });
  }

  /**
   * DELETE /api/auth/saved-events/:eventId
   * Removes a saved event.
   */
  static async removeSavedEvent(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { eventId } = req.params;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (!error) {
          res.json({ success: true, message: 'Event removed from saved list' });
          return;
        }
      } catch (err) {
        console.warn('[AuthController] Remove saved event error:', (err as Error).message);
      }
    }

    const local = localProfiles.get(user.id);
    if (local) {
      local.savedEvents = local.savedEvents.filter((id) => id !== eventId);
    }

    res.json({ success: true, message: 'Event removed from saved list' });
  }
}
