-- AI Module Database Schema
-- This migration creates tables for AI usage tracking, user tiers, and provider performance

-- Create user tiers table
CREATE TABLE IF NOT EXISTS ai_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_requests_per_day INTEGER NOT NULL DEFAULT 100,
  max_tokens_per_day INTEGER NOT NULL DEFAULT 10000,
  max_cost_per_day DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  features TEXT[] NOT NULL DEFAULT ARRAY['text-generation', 'embedding'],
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 10,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user AI tiers junction table
CREATE TABLE IF NOT EXISTS user_ai_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES ai_tiers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create AI usage logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('text-generation', 'embedding', 'image-generation', 'audio-generation', 'other')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  duration INTEGER, -- Duration in milliseconds
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provider performance tracking table
CREATE TABLE IF NOT EXISTS ai_provider_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  average_response_time INTEGER, -- Average response time in milliseconds
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  error_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_requests > 0 THEN (failed_requests::DECIMAL / total_requests::DECIMAL) * 100
      ELSE 0
    END
  ) STORED,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_requests > 0 THEN (successful_requests::DECIMAL / total_requests::DECIMAL) * 100
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model, date)
);

-- Create AI models registry table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'embedding', 'image', 'audio', 'multimodal')),
  max_tokens INTEGER NOT NULL,
  cost_per_token DECIMAL(10,8) NOT NULL DEFAULT 0.00000001,
  cost_per_request DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capabilities TEXT[] NOT NULL DEFAULT ARRAY[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  deprecated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model_id)
);

-- Create AI cache table for response caching
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI rate limiting table
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, window_type, window_start)
);

-- Insert default tiers
INSERT INTO ai_tiers (name, max_requests_per_day, max_tokens_per_day, max_cost_per_day, features, rate_limit_per_minute, rate_limit_per_hour) VALUES
  ('free', 100, 10000, 1.00, ARRAY['text-generation', 'embedding'], 10, 100),
  ('basic', 500, 50000, 5.00, ARRAY['text-generation', 'embedding', 'image-generation'], 20, 200),
  ('pro', 2000, 200000, 20.00, ARRAY['text-generation', 'embedding', 'image-generation', 'audio-generation'], 50, 500),
  ('enterprise', 10000, 1000000, 100.00, ARRAY['text-generation', 'embedding', 'image-generation', 'audio-generation', 'multimodal'], 100, 1000)
ON CONFLICT (name) DO NOTHING;

-- Insert default AI models
INSERT INTO ai_models (provider, model_id, name, type, max_tokens, cost_per_token, cost_per_request, capabilities) VALUES
  -- OpenAI Models
  ('openai', 'gpt-4-turbo-preview', 'GPT-4 Turbo', 'text', 128000, 0.00001, 0.00, ARRAY['text-generation', 'function-calling']),
  ('openai', 'gpt-4', 'GPT-4', 'text', 8192, 0.00003, 0.00, ARRAY['text-generation', 'function-calling']),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'text', 4096, 0.0000015, 0.00, ARRAY['text-generation', 'function-calling']),
  ('openai', 'text-embedding-ada-002', 'Text Embedding Ada', 'embedding', 8191, 0.0000001, 0.00, ARRAY['embedding']),
  ('openai', 'dall-e-3', 'DALL-E 3', 'image', 0, 0.00, 0.04, ARRAY['image-generation']),
  
  -- Anthropic Models
  ('anthropic', 'claude-3-haiku-20240307', 'Claude 3 Haiku', 'text', 200000, 0.00000025, 0.00, ARRAY['text-generation', 'function-calling']),
  ('anthropic', 'claude-3-sonnet-20240229', 'Claude 3 Sonnet', 'text', 200000, 0.000003, 0.00, ARRAY['text-generation', 'function-calling']),
  
  -- Google AI Models
  ('google', 'gemini-pro', 'Gemini Pro', 'text', 32768, 0.0000005, 0.00, ARRAY['text-generation']),
  ('google', 'embedding-001', 'Text Embedding Model', 'embedding', 2048, 0.0000001, 0.00, ARRAY['embedding']),
  
  -- Cohere Models
  ('cohere', 'command', 'Command', 'text', 4096, 0.000003, 0.00, ARRAY['text-generation']),
  ('cohere', 'command-nightly', 'Command Nightly', 'text', 4096, 0.000003, 0.00, ARRAY['text-generation']),
  ('cohere', 'embed-english-v3.0', 'Embed English v3.0', 'embedding', 512, 0.0000001, 0.00, ARRAY['embedding'])
ON CONFLICT (provider, model_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_timestamp ON ai_usage_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_timestamp ON ai_usage_logs(provider, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_operation_timestamp ON ai_usage_logs(operation, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_success_timestamp ON ai_usage_logs(success, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_provider_performance_provider_date ON ai_provider_performance(provider, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_provider_performance_model_date ON ai_provider_performance(model, date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_cache_key ON ai_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user_window ON ai_rate_limits(user_id, window_type, window_start DESC);

-- Create RLS (Row Level Security) policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage logs
CREATE POLICY "Users can view own usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own tier assignments
CREATE POLICY "Users can view own tier assignments" ON user_ai_tiers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own rate limits
CREATE POLICY "Users can view own rate limits" ON ai_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert usage logs
CREATE POLICY "Service can insert usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service');

-- Service role can update usage logs
CREATE POLICY "Service can update usage logs" ON ai_usage_logs
  FOR UPDATE WITH CHECK (auth.jwt()->>'role' = 'service');

-- Service role can insert tier assignments
CREATE POLICY "Service can insert tier assignments" ON user_ai_tiers
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service');

-- Service role can update tier assignments
CREATE POLICY "Service can update tier assignments" ON user_ai_tiers
  FOR UPDATE WITH CHECK (auth.jwt()->>'role' = 'service');

-- Service role can manage rate limits
CREATE POLICY "Service can manage rate limits" ON ai_rate_limits
  FOR ALL WITH CHECK (auth.jwt()->>'role' = 'service');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ai_usage_logs_updated_at 
  BEFORE UPDATE ON ai_usage_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_tiers_updated_at 
  BEFORE UPDATE ON user_ai_tiers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_performance_updated_at 
  BEFORE UPDATE ON ai_provider_performance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at 
  BEFORE UPDATE ON ai_models 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_cache_updated_at 
  BEFORE UPDATE ON ai_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_rate_limits_updated_at 
  BEFORE UPDATE ON ai_rate_limits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create function to aggregate daily provider performance
CREATE OR REPLACE FUNCTION aggregate_provider_performance()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_provider_performance (provider, model, date, total_requests, successful_requests, failed_requests, average_response_time, total_tokens, total_cost)
  SELECT 
    provider,
    model,
    DATE(timestamp) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    AVG(duration) as average_response_time,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost
  FROM ai_usage_logs
  WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
    AND provider IS NOT NULL
    AND model IS NOT NULL
  GROUP BY provider, model, DATE(timestamp)
  ON CONFLICT (provider, model, date) 
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    average_response_time = EXCLUDED.average_response_time,
    total_tokens = EXCLUDED.total_tokens,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();
END;
$$ language 'plpgsql';

-- Create function to clean up old usage logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_usage_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create function to initialize user rate limits
CREATE OR REPLACE FUNCTION initialize_user_rate_limits()
RETURNS trigger AS $$
BEGIN
  INSERT INTO ai_rate_limits (user_id, window_type, request_count, window_start)
  VALUES 
    (NEW.user_id, 'minute', 0, DATE_TRUNC('minute', NOW())),
    (NEW.user_id, 'hour', 0, DATE_TRUNC('hour', NOW())),
    (NEW.user_id, 'day', 0, DATE_TRUNC('day', NOW()))
  ON CONFLICT (user_id, window_type, window_start) 
  DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to initialize rate limits for new users
CREATE TRIGGER initialize_user_rate_limits_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_rate_limits();

-- Create view for usage analytics
CREATE OR REPLACE VIEW ai_usage_analytics AS
SELECT 
  u.id as user_id,
  u.email,
  t.name as tier_name,
  t.max_requests_per_day,
  t.max_tokens_per_day,
  t.max_cost_per_day,
  COALESCE(daily_stats.requests_today, 0) as requests_today,
  COALESCE(daily_stats.tokens_today, 0) as tokens_today,
  COALESCE(daily_stats.cost_today, 0) as cost_today,
  t.max_requests_per_day - COALESCE(daily_stats.requests_today, 0) as remaining_requests,
  t.max_tokens_per_day - COALESCE(daily_stats.tokens_today, 0) as remaining_tokens,
  t.max_cost_per_day - COALESCE(daily_stats.cost_today, 0) as remaining_cost
FROM auth.users u
LEFT JOIN user_ai_tiers ut ON u.id = ut.user_id
LEFT JOIN ai_tiers t ON ut.tier_id = t.id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as requests_today,
    SUM(total_tokens) as tokens_today,
    SUM(cost) as cost_today
  FROM ai_usage_logs
  WHERE DATE(timestamp) = CURRENT_DATE
  GROUP BY user_id
) daily_stats ON u.id = daily_stats.user_id;

-- Create view for provider performance analytics
CREATE OR REPLACE VIEW ai_provider_analytics AS
SELECT 
  provider,
  model,
  date,
  total_requests,
  successful_requests,
  failed_requests,
  success_rate,
  error_rate,
  average_response_time,
  total_tokens,
  total_cost,
  CASE 
    WHEN total_requests > 0 THEN total_cost / total_requests
    ELSE 0
  END as average_cost_per_request
FROM ai_provider_performance
ORDER BY date DESC, total_requests DESC;

-- Grant permissions
GRANT SELECT ON ai_usage_analytics TO authenticated;
GRANT SELECT ON ai_provider_analytics TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;