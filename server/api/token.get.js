export default defineEventHandler(() => {
    return { token: process.env.PUBLIC_MAPBOX_TOKEN };
});
