const CHAT_RESPONSES: { match: RegExp; text: string }[] = [
  { match: /expir|going bad|spoil/i, text: "Your spinach and leftovers are the soonest to expire — use them within the next day or two for best quality." },
  { match: /recipe|cook|make|dinner/i, text: "With what's fresh right now, try a quick stir-fry or a creamy veggie soup — both use up items before they turn." },
  { match: /shop|buy|need|out of/i, text: "You're low on eggs and milk. I'd add those to your next shopping trip." },
  { match: /fresh|how.*doing|status/i, text: "Overall your fridge is in decent shape — a couple of produce items need attention soon, everything else looks good." },
  { match: /.*/, text: "Good question! Based on what's in your fridge, I'd keep an eye on anything nearing its use-by window and plan a meal around it tonight." },
];

export function chatBotReply(text: string): string {
  const hit = CHAT_RESPONSES.find((r) => r.match.test(text));
  return hit ? hit.text : CHAT_RESPONSES[CHAT_RESPONSES.length - 1].text;
}
