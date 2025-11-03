
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface MessagePart {
    text: string;
}

export interface Message {
  role: Role;
  parts: MessagePart[];
}
