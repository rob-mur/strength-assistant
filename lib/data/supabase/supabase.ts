import { Platform } from "react-native";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../models/supabase";

interface SupabaseInitializer {
  initSupabase(): void;
  getSupabaseClient(): SupabaseClient<Database>;
}

const getSupabaseModule = (): SupabaseInitializer => {
  const importModule = eval("require");
  if (Platform.OS === "web") {
    return importModule("./supabase/supabase.web");
  } else {
    return importModule("./supabase/supabase.native");
  }
};

export const initSupabase = () => getSupabaseModule().initSupabase();
export const getSupabaseClient = () => getSupabaseModule().getSupabaseClient();
