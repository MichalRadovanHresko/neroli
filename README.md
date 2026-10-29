# NÉROLI – Perfume Making Webapp (Mobile first)

Learn how to make perfumes: browse scents, build your own recipes, save favourites and get AI help.
Built with React 19, Vite, Tailwind CSS v4 and Supabase (plain JavaScript).

## Features

- Sign up / sign in, onboarding and profile with avatar
- Scent library (Explore, scent detail, favourites, "Explore by note")
- Recipe builder (Add page): ingredients, fragrance profile sliders, steps, equipment, media, cover photo, public/private
- AI recipe generator (Claude via a Supabase Edge Function) – NÉROLI+ only
- Community and premium recipes, saving, comments
- NÉROLI+ (premium, currently a fake flag in `user_metadata`): Scent Profile, Scent Wrapped, "Pairs well with"
- Shop with equipment links, notifications (placeholders), 404 page

> **Note:** The app cannot be run locally without the API keys. The Supabase keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and the Anthropic key (`ANTHROPIC_API_KEY`) are private and are not included in this repository. Without them, sign in, scents, recipes and the AI generator will not work.

## To do list

- [x] Sign up / sign in and onboarding
- [x] Database with scents connected to the app
- [x] Explore page with recipes 
- [x] AI recipe assistant
- [x] Smooth bottom nav bar
- [x] Overall design
- [x] Shop page
- [x] Add Page (functional)
- [ ] Real notifications (currently placeholders)
- [ ] 3D model bottle customization
- [ ] Community page with posts, etc...
