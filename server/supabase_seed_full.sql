-- =========================================================================
-- Taskbora Master Database Reset & Seed Script
-- Run this in Supabase SQL Editor (1-Click Run)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Wipe old data clean
TRUNCATE TABLE activities, comments, tasks, project_members, projects, users CASCADE;

-- 2. Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS comments_updated_at ON comments;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- 3. Insert Users (Password for all accounts is: 12345678)
-- Bcrypt Hash for 12345678: $2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2

INSERT INTO users (id, name, email, password_hash, system_role, role, title, avatar_color, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'admin@gmail.com', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'admin', 'admin', 'System Administrator', '#7c3aed', true),
  ('22222222-2222-2222-2222-222222222222', 'Abdalle', 'abdallehussein8@gmail.com', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'lead', 'Lead Solutions Architect', '#0ea5e9', true),
  ('33333333-3333-3333-3333-333333333333', 'Sarah Chen', 'sarah@taskbora.io', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'member', 'Lead UI/UX Designer', '#ec4899', true),
  ('44444444-4444-4444-4444-444444444444', 'Alex Morgan', 'alex@taskbora.io', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'member', 'Senior Full Stack Engineer', '#f59e0b', true),
  ('55555555-5555-5555-5555-555555555555', 'Khalid Jama', 'khalid@taskbora.io', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'member', 'Principal Product Manager', '#10b981', true),
  ('66666666-6666-6666-6666-666666666666', 'Priya Sharma', 'priya@taskbora.io', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'member', 'Backend Systems Engineer', '#ef4444', true),
  ('77777777-7777-7777-7777-777777777777', 'Omar Hassan', 'omar@taskbora.io', '$2b$10$dW0AVnvYZO/5Q.ZvIcr5LurINdraGAyql36jlc6ML4h6CZV5Ftoi2', 'user', 'member', 'DevOps & SRE Specialist', '#8b5cf6', true);

-- 4. Insert Projects
INSERT INTO projects (id, name, key, description, category, status, priority, owner_id, start_date, due_date, budget, task_sequence)
VALUES
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mobile App – NextGen', 'MOB', 'Next-generation cross-platform iOS and Android mobile workspace with offline sync, notifications, and biometric auth.', 'Engineering', 'active', 'urgent', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days', NOW() + INTERVAL '30 days', 45000, 110),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'E-Commerce Platform Redesign', 'ECO', 'Modern headless checkout, Stripe integration, global catalog management, and conversion-optimized checkout funnels.', 'Product', 'active', 'high', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '15 days', NOW() + INTERVAL '25 days', 28000, 107),
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cloud Infrastructure & Kubernetes', 'CLD', 'Zero-downtime CI/CD pipelines, Dockerized microservices, Redis distributed caching, and automated multi-region failover.', 'Infrastructure', 'active', 'high', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '10 days', NOW() + INTERVAL '40 days', 35000, 106),
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Design System & Component Kit', 'DSY', 'Accessible WCAG AAA React primitives, unified color tokens, responsive dark-mode variables, and micro-interactions.', 'Design', 'active', 'medium', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '25 days', NOW() + INTERVAL '10 days', 18000, 105),
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Security Audit & Compliance', 'SEC', 'Penetration testing, RBAC verification, JWT rotation, and comprehensive SOC2 readiness audit.', 'Security', 'planning', 'urgent', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days', 22000, 104);

-- 5. Insert Project Members
INSERT INTO project_members (project_id, user_id, role, joined_at)
VALUES
  -- MOB
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'owner', NOW() - INTERVAL '20 days'),
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'contributor', NOW() - INTERVAL '18 days'),
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'contributor', NOW() - INTERVAL '18 days'),
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'viewer', NOW() - INTERVAL '15 days'),
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'contributor', NOW() - INTERVAL '12 days'),
  -- ECO
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'owner', NOW() - INTERVAL '15 days'),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'contributor', NOW() - INTERVAL '14 days'),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'contributor', NOW() - INTERVAL '14 days'),
  ('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'contributor', NOW() - INTERVAL '10 days'),
  -- CLD
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'owner', NOW() - INTERVAL '10 days'),
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'contributor', NOW() - INTERVAL '10 days'),
  ('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'contributor', NOW() - INTERVAL '8 days'),
  -- DSY
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'owner', NOW() - INTERVAL '25 days'),
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'contributor', NOW() - INTERVAL '25 days'),
  ('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'contributor', NOW() - INTERVAL '20 days'),
  -- SEC
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', NOW() - INTERVAL '5 days'),
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'contributor', NOW() - INTERVAL '5 days'),
  ('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'contributor', NOW() - INTERVAL '4 days');

-- 6. Insert Tasks
INSERT INTO tasks (id, project_id, task_code, title, description, status, priority, assignee_id, reporter_id, created_by, due_date, estimated_hours, tags, checklist)
VALUES
  -- MOB Tasks
  ('b1011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOB-101', 'Complete UX wireframes & gesture flows', 'High-fidelity Figma specs for mobile navigation, swipe actions, and card gestures.', 'completed', 'high', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days', 24, ARRAY['ui', 'figma', 'mobile'], '[{"id":"c1","text":"Review with product manager","completed":true},{"id":"c2","text":"Export iOS/Android assets","completed":true}]'::jsonb),
  ('b1021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOB-102', 'Biometric & JWT Authentication Flow', 'Implement FaceID, TouchID, and silent refresh token rotation across mobile devices.', 'completed', 'urgent', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', 30, ARRAY['auth', 'security', 'jwt'], '[{"id":"c3","text":"Secure storage configuration","completed":true},{"id":"c4","text":"Session expiration fallback","completed":true}]'::jsonb),
  ('b1031111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOB-103', 'Interactive Kanban Drag & Drop Board', 'Touch-friendly fluid column reordering with spring animations and optimistic updates.', 'in_progress', 'urgent', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '4 days', 36, ARRAY['react', 'kanban', 'mobile'], '[{"id":"c5","text":"Drag gesture handlers","completed":true},{"id":"c6","text":"Column persistence API","completed":false}]'::jsonb),
  ('b1041111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOB-104', 'Real-Time Commenting & Mentions', 'Live message updates, @mention user popovers, and unread notification indicators.', 'review', 'medium', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '2 days', 16, ARRAY['comments', 'realtime'], '[]'::jsonb),
  ('b1051111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOB-105', 'Offline SQLite Local Caching', 'Sync engine that buffers create/update requests during network drops and syncs on reconnect.', 'todo', 'high', '66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '12 days', 40, ARRAY['database', 'offline'], '[]'::jsonb),

  -- ECO Tasks
  ('b2011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ECO-101', 'Stripe Checkout & Webhook Integration', 'Payment intents, secure card validation, Apple Pay / Google Pay, and idempotent fulfillment.', 'in_progress', 'urgent', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '3 days', 28, ARRAY['stripe', 'payments'], '[]'::jsonb),
  ('b2021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ECO-102', 'Product Catalog & Faceted Search', 'Elastic-style filtering by category, price, rating, and stock with URL query reflection.', 'completed', 'high', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days', 20, ARRAY['search', 'catalog'], '[]'::jsonb),
  ('b2031111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ECO-103', 'Automated Email Receipt & Invoice PDF', 'Generate downloadable transactional PDF invoice and send branded confirmation email.', 'todo', 'medium', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '10 days', 18, ARRAY['pdf', 'email'], '[]'::jsonb),

  -- CLD Tasks
  ('b3011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CLD-101', 'Multi-Stage Dockerfile Optimization', 'Reduce backend image size from 850MB to under 95MB using Alpine Linux and slim layers.', 'completed', 'medium', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '3 days', 12, ARRAY['docker', 'devops'], '[]'::jsonb),
  ('b3021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CLD-102', 'Automated GitHub Actions CI/CD', 'Automate linting, unit tests, integration test runners, and auto-deploy to production.', 'in_progress', 'high', '77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', NOW() + INTERVAL '5 days', 22, ARRAY['cicd', 'github-actions'], '[]'::jsonb),

  -- DSY Tasks
  ('b4011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DSY-101', 'Design Token Architecture & Variables', 'Centralize CSS design tokens: colors, spacing, radius, fonts, elevation, and transitions.', 'completed', 'high', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '15 days', 16, ARRAY['css', 'tokens', 'design'], '[]'::jsonb),
  ('b4021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DSY-102', 'Form Controls & Accessible Inputs', 'Custom select menus, search autocompletes, toggles, badges, and validation states.', 'in_progress', 'medium', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '6 days', 24, ARRAY['accessibility', 'components'], '[]'::jsonb),

  -- SEC Tasks
  ('b5011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SEC-101', 'Penetration Testing & SQL Injection Scan', 'Comprehensive vulnerability assessment against OWASP Top 10 threats.', 'in_progress', 'urgent', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '7 days', 32, ARRAY['security', 'owasp'], '[]'::jsonb),
  ('b5021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SEC-102', 'Admin RBAC Guard & Route Isolation', 'Verify only platform administrators can reach administrative consoles and bulk user controls.', 'completed', 'high', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', 18, ARRAY['rbac', 'admin', 'auth'], '[]'::jsonb);

-- 7. Insert Comments
INSERT INTO comments (id, task_id, project_id, author_id, body, created_at)
VALUES
  ('c1111111-cccc-cccc-cccc-cccccccccccc', 'b1031111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'The drag-and-drop animation feels incredibly smooth on mobile now. Verified on iPhone and Android!', NOW() - INTERVAL '2 days'),
  ('c2222222-cccc-cccc-cccc-cccccccccccc', 'b1031111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Awesome work Sarah and Alex. Optimistic UI update is merged into main and ready for testing.', NOW() - INTERVAL '1 day'),
  ('c3333333-cccc-cccc-cccc-cccccccccccc', 'b2011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Stripe webhook signatures are validated. Test payments with cards pass with 100% success.', NOW() - INTERVAL '12 hours'),
  ('c4444444-cccc-cccc-cccc-cccccccccccc', 'b2011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Added order summary screen with transaction ID reflection. Pushing to staging today.', NOW() - INTERVAL '3 hours'),
  ('c5555555-cccc-cccc-cccc-cccccccccccc', 'b5011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Penetration test report drafted: 0 critical vulnerabilities found. Rate limiting is active on auth routes.', NOW() - INTERVAL '6 hours');

-- 8. Insert Activity Logs
INSERT INTO activities (id, project_id, task_id, user_id, actor_id, action, description, summary, created_at)
VALUES
  ('d1111111-dddd-dddd-dddd-dddddddddddd', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'task_completed', 'Abdalle completed task MOB-102: Biometric & JWT Authentication Flow', 'Task completed', NOW() - INTERVAL '2 days'),
  ('d2222222-dddd-dddd-dddd-dddddddddddd', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1031111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'status_changed', 'Alex moved Interactive Kanban Board to In Progress', 'Status changed', NOW() - INTERVAL '1 day'),
  ('d3333333-dddd-dddd-dddd-dddddddddddd', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b2011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'task_updated', 'Abdalle updated Stripe Checkout integration with webhook handlers', 'Task updated', NOW() - INTERVAL '16 hours'),
  ('d4444444-dddd-dddd-dddd-dddddddddddd', 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b3011111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'task_completed', 'Omar completed Dockerfile optimization down to 95MB', 'Task completed', NOW() - INTERVAL '1 day'),
  ('d5555555-dddd-dddd-dddd-dddddddddddd', 'a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b5021111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'task_completed', 'Admin completed RBAC guard & route isolation verification', 'Task completed', NOW() - INTERVAL '18 hours'),
  ('d6666666-dddd-dddd-dddd-dddddddddddd', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1041111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'status_changed', 'Sarah submitted Task Commenting & Mentions for review', 'Status changed', NOW() - INTERVAL '5 hours');
