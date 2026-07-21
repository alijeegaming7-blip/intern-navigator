
-- 1. Roles enum + user_roles table + has_role fn
CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'intern');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mentor'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT,
  github_username TEXT,
  bio TEXT,
  current_level TEXT NOT NULL DEFAULT 'L1 - Explorer',
  target_role TEXT NOT NULL DEFAULT 'Full-Stack Engineer',
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  attendance_score INT NOT NULL DEFAULT 100,
  coding_speed INT NOT NULL DEFAULT 50,
  engineering_credits INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Auto-create profile + intern role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'intern');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Skills catalog
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_read_all" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_admin_write" ON public.skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Intern skills
CREATE TABLE public.intern_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency INT NOT NULL DEFAULT 0 CHECK (proficiency BETWEEN 0 AND 100),
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intern_skills TO authenticated;
GRANT ALL ON public.intern_skills TO service_role;
ALTER TABLE public.intern_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intern_skills_self" ON public.intern_skills FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "intern_skills_mentor_read" ON public.intern_skills FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- 7. Case studies
CREATE TABLE public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  estimated_hours INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.case_studies TO authenticated;
GRANT ALL ON public.case_studies TO service_role;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_studies_read" ON public.case_studies FOR SELECT TO authenticated USING (true);
CREATE POLICY "case_studies_admin" ON public.case_studies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Completed case studies
CREATE TABLE public.completed_case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mentor_rating INT CHECK (mentor_rating BETWEEN 1 AND 5),
  notes TEXT,
  UNIQUE (user_id, case_study_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_case_studies TO authenticated;
GRANT ALL ON public.completed_case_studies TO service_role;
ALTER TABLE public.completed_case_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccs_self" ON public.completed_case_studies FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ccs_mentor_read" ON public.completed_case_studies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- 9. Roadmaps
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'L1 - Explorer',
  next_target TEXT NOT NULL DEFAULT '',
  weekly_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_case_studies JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  strong_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  weak_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  technology_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  promotion_readiness INT NOT NULL DEFAULT 0,
  job_readiness INT NOT NULL DEFAULT 0,
  estimated_graduation_date DATE,
  ai_summary TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmaps TO authenticated;
GRANT ALL ON public.roadmaps TO service_role;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmaps_self_rw" ON public.roadmaps FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "roadmaps_mentor_read" ON public.roadmaps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- 10. Mentor reviews
CREATE TABLE public.mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT NOT NULL DEFAULT '',
  review_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_reviews TO authenticated;
GRANT ALL ON public.mentor_reviews TO service_role;
ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_mentor_write" ON public.mentor_reviews FOR ALL TO authenticated
  USING (mentor_id = auth.uid() AND public.has_role(auth.uid(), 'mentor'))
  WITH CHECK (mentor_id = auth.uid() AND public.has_role(auth.uid(), 'mentor'));
CREATE POLICY "reviews_intern_read" ON public.mentor_reviews FOR SELECT TO authenticated
  USING (intern_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 11. Activity events
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_self" ON public.activity_events FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "events_mentor_read" ON public.activity_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- 12. Seed skills + case studies
INSERT INTO public.skills (name, category) VALUES
  ('HTML/CSS','Frontend'), ('JavaScript','Frontend'), ('TypeScript','Frontend'),
  ('React','Frontend'), ('Next.js','Frontend'), ('TailwindCSS','Frontend'),
  ('Node.js','Backend'), ('Express','Backend'), ('NestJS','Backend'),
  ('Laravel','Backend'), ('PHP','Backend'), ('Python','Backend'),
  ('Django','Backend'), ('FastAPI','Backend'), ('PostgreSQL','Database'),
  ('MySQL','Database'), ('MongoDB','Database'), ('Redis','Database'),
  ('Docker','DevOps'), ('Kubernetes','DevOps'), ('AWS','DevOps'),
  ('CI/CD','DevOps'), ('Git','Tools'), ('REST APIs','Backend'),
  ('GraphQL','Backend'), ('Machine Learning','AI'), ('TensorFlow','AI'),
  ('PyTorch','AI'), ('LangChain','AI'), ('Vector DBs','AI');

INSERT INTO public.case_studies (code, title, description, category, difficulty, tech_stack, prerequisites, estimated_hours) VALUES
  ('CS-001','Ezitech Blog Platform','Build a full blog with auth, comments and admin panel.','Full-Stack',2,ARRAY['React','Node.js','PostgreSQL'],ARRAY['JavaScript','React'],40),
  ('CS-002','Realtime Chat App','WebSocket chat with rooms and presence.','Full-Stack',3,ARRAY['React','Node.js','Socket.IO'],ARRAY['Node.js'],35),
  ('CS-003','E-Commerce API','REST API with cart, orders, Stripe payments.','Backend',3,ARRAY['Node.js','Express','PostgreSQL'],ARRAY['REST APIs'],50),
  ('CS-004','Kanban Board','Drag-and-drop project board with realtime sync.','Frontend',2,ARRAY['React','TailwindCSS'],ARRAY['React'],25),
  ('CS-005','Laravel HRMS','HR management system with roles and payroll.','Full-Stack',4,ARRAY['Laravel','MySQL'],ARRAY['PHP','Laravel'],80),
  ('CS-006','AI Resume Screener','LLM-based resume ranking with vector search.','AI',4,ARRAY['Python','FastAPI','Vector DBs'],ARRAY['Python','Machine Learning'],60),
  ('CS-007','Analytics Dashboard','Interactive charts and cohort analysis.','Frontend',3,ARRAY['React','Recharts'],ARRAY['React','TypeScript'],30),
  ('CS-008','Microservices Order System','Order/inventory/notification services with Docker.','DevOps',5,ARRAY['NestJS','Docker','Kubernetes','Redis'],ARRAY['Docker','NestJS'],120),
  ('CS-009','Django CMS','Content management system with editor and roles.','Backend',3,ARRAY['Django','PostgreSQL'],ARRAY['Python','Django'],55),
  ('CS-010','ML Churn Predictor','End-to-end churn prediction pipeline.','AI',4,ARRAY['Python','TensorFlow'],ARRAY['Machine Learning'],45);
