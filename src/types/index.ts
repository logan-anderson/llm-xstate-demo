export type Message = {
  text: string;
  user: "assistant" | "user" | "system" | "tool";
  ctx: any;
};
