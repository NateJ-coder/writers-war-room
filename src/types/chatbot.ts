export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Source {
  web: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: Role;
  content: string;
  sources?: Source[];
}
