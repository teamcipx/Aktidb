import { supabase } from './supabase';

export interface ActivityLog {
  id: string;
  action_type: 'LOGIN' | 'DASHBOARD' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'EXPORT';
  category: string;
  title: string;
  details?: string;
  user_email?: string;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'zx_activity_logs_cache';

export async function logActivity(
  action_type: ActivityLog['action_type'],
  category: string,
  title: string,
  details?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const newLog: ActivityLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    action_type,
    category,
    title,
    details: details || '',
    user_email: 'rakibulislamrovin@gmail.com',
    created_at: timestamp,
  };

  // 1. Local Cache update
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    const logs: ActivityLog[] = existing ? JSON.parse(existing) : [];
    // Prevent duplicated consecutive logs within 2 seconds for DASHBOARD
    if (action_type === 'DASHBOARD' && logs.length > 0) {
      const last = logs[0];
      const timeDiff = new Date(timestamp).getTime() - new Date(last.created_at).getTime();
      if (last.action_type === 'DASHBOARD' && timeDiff < 3000) {
        return;
      }
    }
    logs.unshift(newLog);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch (e) {
    console.warn('LocalStorage log update warning:', e);
  }

  // 2. Supabase persistent insert
  try {
    await supabase.from('activity_logs').insert([{
      id: newLog.id,
      action_type,
      category,
      title,
      details: details || '',
      user_email: newLog.user_email,
      created_at: timestamp
    }]);
  } catch (e) {
    console.warn('Supabase log insert warning:', e);
  }
}

export async function getActivityLogs(limit = 100): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Could not fetch activity_logs from Supabase:', e);
  }

  // Fallback to local storage
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }
  } catch (e) {
    console.error('Error reading local activity logs', e);
  }

  return [];
}

export async function clearActivityLogs(): Promise<void> {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  try {
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.warn('Supabase log clear error:', e);
  }
}
