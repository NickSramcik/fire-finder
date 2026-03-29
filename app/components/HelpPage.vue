<template>
    <div class="h-full overflow-y-auto">
        <div class="max-w-2xl mx-auto px-6 py-10 space-y-10">

            <!-- Header -->
            <div>
                <h1 class="text-3xl font-bold flex items-center gap-3">
                    🔥 Fire Finder
                </h1>
                <p class="mt-2 text-base-content/70">
                    Active US wildfire map with real-time fire points, perimeters, and infrared hotspots.
                    Built for slow connections in rural areas — fast and no fluff.
                </p>
            </div>

            <!-- Using the Map -->
            <section>
                <h2 class="text-xl font-semibold mb-3">Using the Map</h2>
                <ul class="space-y-2 text-base-content/80">
                    <li class="flex gap-2">
                        <span>🔥</span>
                        <span><strong>Fire icons</strong> mark active fire points. Icon size reflects fire area — tap or click for name, status, containment, and acreage.</span>
                    </li>
                    <li class="flex gap-2">
                        <span>🟧</span>
                        <span><strong>Orange fill areas</strong> are fire perimeters — the mapped boundary of a fire's burned area.</span>
                    </li>
                    <li class="flex gap-2">
                        <span>🟡</span>
                        <span><strong>Hotspot dots</strong> are infrared heat detections from satellite. Color and size reflect brightness temperature. Click for satellite, confidence, and fire radiative power.</span>
                    </li>
                </ul>
            </section>

            <!-- Data Sources -->
            <section>
                <h2 class="text-xl font-semibold mb-3">Data Sources</h2>
                <div class="space-y-4">

                    <div class="card bg-base-200">
                        <div class="card-body py-4 px-5">
                            <h3 class="font-semibold">Fire Points & Perimeters</h3>
                            <p class="text-sm text-base-content/70">
                                Active fire locations and mapped perimeters sourced from
                                <!-- TODO: replace with actual source name, e.g. "NIFC / USFS ArcGIS" -->
                                <strong>[fire data source]</strong>.
                                Includes fire name, status, containment percentage, and acreage.
                            </p>
                        </div>
                    </div>

                    <div class="card bg-base-200">
                        <div class="card-body py-4 px-5">
                            <h3 class="font-semibold">Infrared Hotspots</h3>
                            <p class="text-sm text-base-content/70">
                                Satellite-detected heat anomalies from
                                <strong>NASA FIRMS</strong> (Fire Information for Resource Management System),
                                using VIIRS and MODIS sensors. Updated every pass — typically every 6–12 hours per location.
                                Hotspots indicate active burning but are not the same as confirmed fire reports.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            <!-- Refresh Schedule -->
            <section>
                <h2 class="text-xl font-semibold mb-3">Data Freshness</h2>
                <p class="text-base-content/80">
                    Fire point and perimeter data refreshes automatically every <strong>6 hours</strong>.
                    Hotspot data is cached for up to <strong>5 minutes</strong> and renewed on demand.
                    The timestamp shown on the map reflects the last successful data pull.
                </p>
            </section>

            <!-- Understanding Fire Status -->
            <section>
                <h2 class="text-xl font-semibold mb-3">Fire Status Labels</h2>
                <div class="overflow-x-auto">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Meaning</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="badge badge-error badge-sm">Active</span></td>
                                <td class="text-base-content/80">Fire is burning and not fully contained</td>
                            </tr>
                            <tr>
                                <td><span class="badge badge-warning badge-sm">Prescribed</span></td>
                                <td class="text-base-content/80">Intentional burn managed by fire agencies — hidden from default view</td>
                            </tr>
                            <tr>
                                <td><span class="badge badge-ghost badge-sm">Out</span></td>
                                <td class="text-base-content/80">Fully extinguished — hidden from default view</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Limitations -->
            <section>
                <h2 class="text-xl font-semibold mb-3">Limitations</h2>
                <ul class="space-y-2 text-base-content/70 text-sm list-disc list-inside">
                    <li>Hotspot detections can be triggered by non-fire heat sources (industrial sites, volcanoes, gas flares).</li>
                    <li>Cloud cover and smoke can prevent satellite detection of active burning.</li>
                    <li>Perimeter boundaries reflect the last mapped survey, which may lag behind a fast-moving fire.</li>
                    <li>This app is for situational awareness only — always follow official evacuation orders and local emergency services.</li>
                </ul>
            </section>

            <!-- Footer note -->
            <p class="text-xs text-base-content/40 pb-4">
                Fire Finder is a personal project. Data accuracy depends on upstream federal sources.
            </p>

        </div>
    </div>
</template>

<script setup>
// Suppress extraneous non-props attributes warning
defineOptions({
    inheritAttrs: false,
});
</script>
