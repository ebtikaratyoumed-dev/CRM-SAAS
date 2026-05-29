-- ============================================================
-- MIGRATION: In-App Notifications System
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run: all objects are CREATE OR REPLACE / IF NOT EXISTS
-- ============================================================

-- ============================================================
-- 1. Enhance notifications table
-- ============================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;

-- ============================================================
-- 2. Add alert_threshold to stock_items
-- ============================================================
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS alert_threshold INTEGER DEFAULT NULL;

-- ============================================================
-- 3. RLS policy for notifications
-- ============================================================
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;

CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- 4. Trigger: on_task_assigned
--    When a new task is inserted, notify the assigned user
-- ============================================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if someone is actually assigned
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.created_by THEN
    INSERT INTO notifications (user_id, title, message, type, link, entity_type, entity_id, read)
    VALUES (
      NEW.assigned_to,
      '📋 Nouvelle tâche assignée',
      NEW.title,
      'info',
      '/dashboard/tasks',
      'task',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_assigned ON tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================================
-- 5. Trigger: on_task_status_changed
--    When a task's status changes, notify the admin who created it
-- ============================================================
CREATE OR REPLACE FUNCTION notify_task_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_title TEXT;
  v_notif_type TEXT;
BEGIN
  -- Only fire when status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Choose title and type based on new status
    IF NEW.status = 'Terminé' THEN
      v_notif_title := '✅ Tâche terminée';
      v_notif_type := 'success';
    ELSIF NEW.status = 'En cours' THEN
      v_notif_title := '🔄 Tâche en cours';
      v_notif_type := 'info';
    ELSIF NEW.status = 'En révision' THEN
      v_notif_title := '👁️ Tâche en révision';
      v_notif_type := 'info';
    ELSE
      v_notif_title := '📋 Statut de tâche mis à jour';
      v_notif_type := 'info';
    END IF;

    -- Notify the creator (admin) if the status was changed by someone else
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, link, entity_type, entity_id, read)
      VALUES (
        NEW.created_by,
        v_notif_title,
        NEW.title || ' → ' || NEW.status,
        v_notif_type,
        '/dashboard/tasks',
        'task',
        NEW.id,
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_status_changed ON tasks;
CREATE TRIGGER on_task_status_changed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_status_changed();

-- ============================================================
-- 6. Trigger: on_stock_low_alert
--    When stock quantity is updated and drops to or below
--    the admin-defined alert_threshold, notify all admins
--    in the same company.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_stock_low()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_admin_owner UUID;
BEGIN
  -- Only fire when quantity actually changed and threshold is set
  IF NEW.alert_threshold IS NOT NULL
     AND NEW.quantity <= NEW.alert_threshold
     AND (OLD.quantity IS DISTINCT FROM NEW.quantity)
     AND (OLD.quantity > NEW.alert_threshold) -- only fire once when crossing threshold
  THEN
    -- Get the admin_owner_id from the creator of this stock item
    SELECT admin_owner_id INTO v_admin_owner
    FROM profiles
    WHERE id = NEW.created_by;

    -- Notify all admins in this company
    FOR v_admin IN
      SELECT id FROM profiles
      WHERE admin_owner_id = v_admin_owner
        AND role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, link, entity_type, entity_id, read)
      VALUES (
        v_admin.id,
        '⚠️ Stock faible',
        NEW.name || ' — ' || NEW.quantity || ' ' || NEW.unit || ' restant(s)',
        'warning',
        '/dashboard/stock',
        'stock',
        NEW.id,
        false
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stock_low_alert ON stock_items;
CREATE TRIGGER on_stock_low_alert
  AFTER UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_stock_low();
