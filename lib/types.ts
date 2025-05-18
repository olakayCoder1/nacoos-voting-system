export type User = {
  id: string
  matric_number: string
  name: string
  email?: string
  department?: string
  level?: string
  is_active: boolean // Added is_active field
  created_at: string
  updated_at: string
}

export type Admin = {
  id: string
  username: string
  name: string
  email?: string
  role: string
  is_active: boolean // Added is_active field
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  description?: string
  is_active: boolean // Already present
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
  is_active: boolean // Added is_active field
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


export type VoteResult = {
  category: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  };
  candidates: {
    id: string;
    name: string;
    image_url?: string;
    votes: number;
  }[];
  totalVotes: number;
};

export type VoteStats = {
  totalVoters: number;
  totalVoted: number;
  participationRate: number;
};

export type VotingResultsResponse = {
  results: VoteResult[];
  stats: VoteStats;
  error?: string;
};