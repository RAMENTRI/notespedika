export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  credits: number;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  file_url: string;
  storage_path: string;
  file_type: string;
  download_cost: number;
  created_at: string;
  users?: {
    name: string | null;
    email: string | null;
  } | null;
};

export type Toast = {
  type: "success" | "error" | "info";
  message: string;
};
