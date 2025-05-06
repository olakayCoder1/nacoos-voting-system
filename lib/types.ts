export type User = {
  id: string
  matric_number: string
  name: string
  email?: string
  department?: string
  level?: string
  created_at: string
  updated_at: string
}

export type Admin = {
  id: string
  username: string
  name: string
  email?: string
  role: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  description?: string
  is_active: boolean
  display_order?: number
  created_at: string
  updated_at: string
}

export type Candidate = {
  id: string
  category_id: string
  name: string
  bio?: string
  image_url?: string
  created_at: string
  updated_at: string
  votes_count?: number // Virtual field for counting votes
}

export type Vote = {
  id: string
  user_id: string
  candidate_id: string
  category_id: string
  created_at: string
}

export type Setting = {
  id: string
  key: string
  value: {
    status: boolean
    message: string
  }
  created_at: string
  updated_at: string
}
