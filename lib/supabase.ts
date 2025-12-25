
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: A URL deve ser o "Project URL" encontrado em Settings > API.
// Ela NÃO deve começar com "db.", deve ser apenas o ID do projeto.
const supabaseUrl = 'https://syoelpddicmssxlacbrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5b2VscGRkaWNtc3N4bGFjYnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODE3OTcsImV4cCI6MjA4MjI1Nzc5N30.WB3v4OteuWgtTLxbSyqBqfNy_5pRDUGa7S9i9KE4jxk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
