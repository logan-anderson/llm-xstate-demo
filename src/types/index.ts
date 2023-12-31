export type Message =
  | {
      text: string;
      user: "assistant" | "user" | "system";
      ctx: any;
    }
  | {
      text: string;
      user: "tool";
      logs?: string[];
      toolInput?: string;
      toolOutput?: string;
      toolName: string;
    };
