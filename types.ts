
export enum PersonaType {
  TEACHER = 'Teacher',
  FRIEND = 'Friend',
  MENTOR = 'Mentor',
  HYPE = 'Hype-Man',
  CALM = 'Zen Master',
  COMEDIAN = 'Comedian',
  SCIENTIST = 'Scientist',
  GAMER = 'Gamer Pro',
  POET = 'Poet',
  DETECTIVE = 'Detective'
}

export interface Persona {
  type: PersonaType;
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  color: string;
  description: string;
  instruction: string;
  icon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
