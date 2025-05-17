document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired. Initializing script...");

    // --- DOM-elementit ---
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const settingsDashboard = document.getElementById('settings-dashboard');
    const closeDashboardBtn = document.getElementById('close-dashboard-btn');
    const fullscreenToggleDashboardBtn = document.getElementById('fullscreen-toggle-dashboard');
    const fontSelect = document.getElementById('font-select');
    const locationInput = document.getElementById('location-input');
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    const importSettingsInput = document.getElementById('import-settings-input');
    const currentYearDashboardEl = document.getElementById('current-year-dashboard');
    const localTimeDisplayFooter = document.getElementById('local-time-display-footer');
    const currentTimeDisplayTop = document.getElementById('current-time-display');

    const newsModal = document.getElementById('news-modal');
    const modalCloseBtn = newsModal ? newsModal.querySelector('.modal-close-btn') : null;
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalFullContent = document.getElementById('modal-full-content');
    const modalDescription = document.getElementById('modal-description');
    const modalLink = document.getElementById('modal-link');
    const modalSourceInfo = document.getElementById('modal-source-info');

    const slider = document.querySelector('.hero-slider');
    const rssUrlInput = document.getElementById('rss-url-input');
    const addRssBtn = document.getElementById('add-rss-btn');
    const rssFeedsListUI = document.getElementById('rss-feeds-list');
    const slideDurationInput = document.getElementById('slide-duration-input');

    const podcastAudioPlayer = document.getElementById('podcast-audio-player');
    const podcastPlayerContainer = document.getElementById('podcast-player-container');
    const podcastEpisodeTitleDisplay = document.getElementById('podcast-episode-title-display');
    const podcastPlayPauseBtn = document.getElementById('podcast-play-pause-btn');
    const podcastPrevBtn = document.getElementById('podcast-prev-btn');
    const podcastNextBtn = document.getElementById('podcast-next-btn');
    const podcastProgressSlider = document.getElementById('podcast-progress-slider');
    const podcastCurrentTimeEl = document.getElementById('podcast-current-time');
    const podcastDurationTimeEl = document.getElementById('podcast-duration-time');
    const podcastVolumeSlider = document.getElementById('podcast-volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const podcastRssUrlInput = document.getElementById('podcast-rss-url-input');
    const setPodcastRssBtn = document.getElementById('set-podcast-rss-btn');
    const podcastEpisodesListUI = document.getElementById('podcast-episodes-list');
    const currentPodcastFeedDisplay = document.getElementById('current-podcast-feed-display');

    const googleFontLink = document.getElementById('google-font-link');

    // --- Tilamuuttujat ---
    let userSettings = {
        rssFeeds: [],
        podcastFeedUrl: null,
        podcastFeedTitle: "Ei syötettä",
        slideDuration: 15000,
        location: "",
        volume: 0.5,
        isMuted: false,
        selectedFont: 'Roboto',
    };

    let allFeedItems = [];
    let currentSlideIndex = 0;
    let slideInterval;
    const FEED_REFRESH_INTERVAL = 10 * 60 * 1000;
    const WEATHER_SLIDE_INTERVAL = 10;
    let newsCounterForWeather = 0;

    let podcastEpisodes = [];
    let currentPlayingEpisodeIndex = -1;
    let lastPlayedAudioUrl = null;
    let lastPlayedAudioTime = 0;
    let isLoadingPodcastFeed = false;

    // --- Asetusten Lataus ja Tallennus ---
    function loadSettings() {
        userSettings.rssFeeds = JSON.parse(localStorage.getItem('rssFeeds_cfoc_v2')) || [];
        userSettings.podcastFeedUrl = localStorage.getItem('podcastFeedUrl_cfoc_v2') || null;
        userSettings.podcastFeedTitle = localStorage.getItem('podcastFeedTitle_cfoc_v2') || "Ei syötettä";
        userSettings.slideDuration = parseInt(localStorage.getItem('slideDuration_cfoc_v2')) || 15000;
        userSettings.location = localStorage.getItem('userLocation_cfoc_v2') || "";
        userSettings.volume = parseFloat(localStorage.getItem('volume_cfoc_v2')) || 0.5;
        userSettings.isMuted = JSON.parse(localStorage.getItem('isMuted_cfoc_v2')) || false;
        userSettings.selectedFont = localStorage.getItem('selectedFont_cfoc_v2') || 'Roboto';

        lastPlayedAudioUrl = localStorage.getItem('lastPlayedAudioUrl_cfoc_v2') || null;
        lastPlayedAudioTime = parseFloat(localStorage.getItem('lastPlayedAudioTime_cfoc_v2')) || 0;

        if (slideDurationInput) slideDurationInput.value = userSettings.slideDuration / 1000;
        if (locationInput) locationInput.value = userSettings.location;
        if (fontSelect) fontSelect.value = userSettings.selectedFont;
        applyFont(userSettings.selectedFont);

        if (podcastVolumeSlider) podcastVolumeSlider.value = userSettings.volume;
        if (podcastAudioPlayer) {
            podcastAudioPlayer.volume = userSettings.isMuted ? 0 : userSettings.volume;
            podcastAudioPlayer.muted = userSettings.isMuted;
        }
        updateVolumeIcon();
        console.log("DEBUG: Settings loaded:", userSettings);
    }

    function saveAppSettings() {
        localStorage.setItem('rssFeeds_cfoc_v2', JSON.stringify(userSettings.rssFeeds));
        localStorage.setItem('podcastFeedUrl_cfoc_v2', userSettings.podcastFeedUrl || '');
        localStorage.setItem('podcastFeedTitle_cfoc_v2', userSettings.podcastFeedTitle || 'Ei syötettä');
        localStorage.setItem('slideDuration_cfoc_v2', userSettings.slideDuration.toString());
        localStorage.setItem('userLocation_cfoc_v2', userSettings.location);
        localStorage.setItem('volume_cfoc_v2', userSettings.volume.toString());
        localStorage.setItem('isMuted_cfoc_v2', JSON.stringify(userSettings.isMuted));
        localStorage.setItem('selectedFont_cfoc_v2', userSettings.selectedFont);
        console.log("DEBUG: App settings saved.");
    }

    // --- Fontin vaihto ---
    function applyFont(fontName) {
        if (!googleFontLink || !fontName) return;
        const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;700&display=swap`;
        googleFontLink.href = fontUrl;
        document.documentElement.style.setProperty('--font-family-current', `'${fontName}', sans-serif`);
    }

    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            const newFont = e.target.value;
            applyFont(newFont);
            userSettings.selectedFont = newFont; // Päivitä userSettings ennen tallennusta
            saveAppSettings();
        });
    }

    // --- Glass Effect ---
    if (podcastPlayerContainer) podcastPlayerContainer.classList.add('glass-effect');
    if (settingsDashboard) settingsDashboard.classList.add('glass-effect');

    // --- Tapahtumankäsittelijät ---
    if (openSettingsBtn && settingsDashboard) {
        openSettingsBtn.addEventListener('click', () => {
            settingsDashboard.style.display = 'flex';
            setTimeout(() => settingsDashboard.classList.add('open'), 10);
        });
    }

    if (closeDashboardBtn && settingsDashboard) {
        closeDashboardBtn.addEventListener('click', () => {
            settingsDashboard.classList.remove('open');
            const handleTransitionEnd = () => {
                if (!settingsDashboard.classList.contains('open')) settingsDashboard.style.display = 'none';
                settingsDashboard.removeEventListener('transitionend', handleTransitionEnd);
            };
            settingsDashboard.addEventListener('transitionend', handleTransitionEnd);
            setTimeout(() => { if (!settingsDashboard.classList.contains('open')) settingsDashboard.style.display = 'none'; }, 400);
        });
    }

    if (fullscreenToggleDashboardBtn) {
        fullscreenToggleDashboardBtn.addEventListener('click', () => toggleFullScreen(fullscreenToggleDashboardBtn));
    }
    document.addEventListener('fullscreenchange', () => {
        const btn = fullscreenToggleDashboardBtn;
        if (btn) {
            btn.innerHTML = document.fullscreenElement ? '<span class="button-icon">↙️</span> Poistu kokoruudusta' : '<span class="button-icon">↗️</span> Siirry kokoruututilaan';
        }
    });

    if (slideDurationInput) {
        slideDurationInput.addEventListener('change', (e) => {
            const newDurationSeconds = parseInt(e.target.value);
            if (newDurationSeconds >= 3 && newDurationSeconds <= 60) {
                userSettings.slideDuration = newDurationSeconds * 1000;
                saveAppSettings();
                if (allFeedItems.length > 0) startNewsAutoPlay();
            } else {
                alert("Vaihtonopeuden tulee olla 3-60 sekuntia.");
                e.target.value = userSettings.slideDuration / 1000;
            }
        });
    }

    if (locationInput) {
        locationInput.addEventListener('input', (e) => {
            userSettings.location = e.target.value.trim();
            saveAppSettings();
        });
    }

    if (addRssBtn && rssUrlInput) {
        addRssBtn.addEventListener('click', () => {
            const url = rssUrlInput.value.trim();
            if (url) {
                if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
                    alert('Virheellinen URL.'); return;
                }
                if (!userSettings.rssFeeds.includes(url)) {
                    userSettings.rssFeeds.push(url);
                    saveAppSettings(); renderNewsFeedsList(); rssUrlInput.value = '';
                    fetchAllNewsFeedsAndBuildSlider();
                } else { alert('Uutissyöte on jo lisätty.'); }
            } else { alert("Syötä URL."); }
        });
    }

    if (setPodcastRssBtn && podcastRssUrlInput) {
        setPodcastRssBtn.addEventListener('click', async () => {
            if (isLoadingPodcastFeed) { console.warn("DEBUG: Podcast feed loading in progress."); return; }
            const url = podcastRssUrlInput.value.trim();
            if (!url) { alert("Syötä URL."); return; }
            if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
                alert('Virheellinen podcast RSS URL.'); return;
            }
            isLoadingPodcastFeed = true;
            const originalButtonHTML = setPodcastRssBtn.innerHTML; // Tallenna koko HTML
            setPodcastRssBtn.disabled = true; podcastRssUrlInput.disabled = true;
            setPodcastRssBtn.innerHTML = '<span class="button-icon">⏳</span> Ladataan...';
            if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Haetaan syötettä...</li>';
            try {
                const success = await fetchPodcastFeedWithTimeout(url, 20000);
                if (success) {
                    userSettings.podcastFeedUrl = url; // fetchPodcastFeedWithTimeout asettaa currentPodcastFeedTitle
                    userSettings.podcastFeedTitle = currentPodcastFeedTitle; // Joka kopioidaan tähän
                    saveAppSettings(); podcastRssUrlInput.value = '';
                } else {
                    if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Syötteen lataus epäonnistui.</li>';
                }
            } catch (error) {
                console.error("DEBUG: Unexpected error in setPodcastRssBtn:", error);
                if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Odottamaton virhe.</li>';
            } finally {
                isLoadingPodcastFeed = false;
                setPodcastRssBtn.innerHTML = originalButtonHTML; // Palauta alkuperäinen HTML
                setPodcastRssBtn.disabled = false; podcastRssUrlInput.disabled = false;
            }
        });
    }

    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', () => {
            const settingsToExport = { ...userSettings };
            settingsToExport.lastPlayedAudioUrl = localStorage.getItem('lastPlayedAudioUrl_cfoc_v2') || null;
            settingsToExport.lastPlayedAudioTime = parseFloat(localStorage.getItem('lastPlayedAudioTime_cfoc_v2')) || 0;
            const dataStr = JSON.stringify(settingsToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = 'cfoc_settings.json';
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click(); linkElement.remove();
        });
    }

    if (importSettingsInput) {
        importSettingsInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        userSettings.rssFeeds = importedData.rssFeeds && Array.isArray(importedData.rssFeeds) ? importedData.rssFeeds : userSettings.rssFeeds;
                        userSettings.podcastFeedUrl = typeof importedData.podcastFeedUrl === 'string' || importedData.podcastFeedUrl === null ? importedData.podcastFeedUrl : userSettings.podcastFeedUrl;
                        userSettings.podcastFeedTitle = typeof importedData.podcastFeedTitle === 'string' || importedData.podcastFeedTitle === null ? importedData.podcastFeedTitle : userSettings.podcastFeedTitle;
                        userSettings.slideDuration = typeof importedData.slideDuration === 'number' && importedData.slideDuration >= 3000 ? importedData.slideDuration : userSettings.slideDuration;
                        userSettings.location = typeof importedData.location === 'string' ? importedData.location : userSettings.location;
                        userSettings.volume = typeof importedData.volume === 'number' && importedData.volume >=0 && importedData.volume <=1 ? importedData.volume : userSettings.volume;
                        userSettings.isMuted = typeof importedData.isMuted === 'boolean' ? importedData.isMuted : userSettings.isMuted;
                        userSettings.selectedFont = typeof importedData.selectedFont === 'string' ? importedData.selectedFont : userSettings.selectedFont;
                        saveAppSettings();
                        if (importedData.lastPlayedAudioUrl) localStorage.setItem('lastPlayedAudioUrl_cfoc_v2', importedData.lastPlayedAudioUrl);
                        if (typeof importedData.lastPlayedAudioTime === 'number') localStorage.setItem('lastPlayedAudioTime_cfoc_v2', importedData.lastPlayedAudioTime.toString());
                        alert("Asetukset tuotu! Sivu ladataan uudelleen.");
                        window.location.reload();
                    } catch (err) {
                        alert("Virhe asetustiedostoa käsiteltäessä."); console.error("Error importing settings:", err);
                    } finally {
                        importSettingsInput.value = '';
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // --- Ydin Funktiot ---
    function updateLocalTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
        if (currentTimeDisplayTop) { // Päivitä yläkulman kello
            currentTimeDisplayTop.textContent = timeString;
        }
        if (localTimeDisplayFooter) { // Päivitä dashboardin footerin kello
            localTimeDisplayFooter.textContent = timeString;
        }
    }

    function toggleFullScreen(buttonElement) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => { if (buttonElement) buttonElement.innerHTML = '<span class="button-icon">↙️</span> Poistu kokoruudusta'; })
                .catch(err => { alert(`Kokoruututilan virhe: ${err.message}`); });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => { if (buttonElement) buttonElement.innerHTML = '<span class="button-icon">↗️</span> Siirry kokoruututilaan'; });
            }
        }
    }

    function renderNewsFeedsList() {
        if (!rssFeedsListUI) return;
        rssFeedsListUI.innerHTML = '';
        userSettings.rssFeeds.forEach((feedUrl, index) => {
            const li = document.createElement('li');
            const span = document.createElement('span'); span.textContent = feedUrl; li.appendChild(span);
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '🗑️'; removeBtn.title = "Poista";
            removeBtn.addEventListener('click', () => {
                userSettings.rssFeeds.splice(index, 1);
                saveAppSettings(); renderNewsFeedsList(); fetchAllNewsFeedsAndBuildSlider();
            });
            li.appendChild(removeBtn); rssFeedsListUI.appendChild(li);
        });
    }

    async function fetchRSSForNews(feedUrl) {
        console.log(`DEBUG: Attempting to fetch news from: ${feedUrl}`);
        try {
            // const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(feedUrl);
            if (!response.ok) { console.error(`DEBUG: Error news ${feedUrl}: ${response.status}`); return []; }
            const text = await response.text();
            if (!text) { console.warn(`DEBUG: Empty feed ${feedUrl}.`); return []; }
            const parser = new DOMParser(); const xmlDoc = parser.parseFromString(text, "application/xml");
            if (xmlDoc.querySelector('parsererror')) { console.error(`DEBUG: XML Error ${feedUrl}`); return []; }
            const items = [];
            const feedOrigin = new URL(feedUrl).origin;
            const channelTitle = xmlDoc.querySelector('rss > channel > title')?.textContent || // RSS
                                 xmlDoc.querySelector('feed > title')?.textContent ||          // Atom
                                 feedOrigin.replace(/^https?:\/\/(www\.)?/, ''); // Fallback
    
            xmlDoc.querySelectorAll('item, entry').forEach(iN => {
                const pubDateStr = iN.querySelector('pubDate')?.textContent || iN.querySelector('published')?.textContent || iN.querySelector('updated')?.textContent;
                const descriptionText = (iN.querySelector('description')?.textContent || iN.querySelector('summary')?.textContent || '');
                // Poistetaan HTML descriptionTextistä, jos sitä käytetään fallbackina tai otsikkomaisena
                const cleanDescription = descriptionText.replace(/<[^>]+>/g, '').trim();
    
                // content:encoded sisältää usein koko artikkelin HTML-muodossa
                let fullContentHTML = iN.querySelector('content\\:encoded')?.innerHTML; // Säilytä HTML-muotoilu
                if (!fullContentHTML) { // Fallback, jos content:encoded puuttuu
                     // Jos descriptionissa oli HTML:ää, käytä sitä, muuten puhdasta tekstiä
                    fullContentHTML = descriptionText.includes("<") ? descriptionText : cleanDescription;
                }
    
    
                const copyright = iN.querySelector('copyright, dc\\:rights')?.textContent || null;
                const guidNode = iN.querySelector('guid');
                let itemLink = iN.querySelector('link[href]')?.getAttribute('href') || iN.querySelector('link')?.textContent || '#';
                // Joskus GUID on URL ja parempi kuin link-elementti
                if (guidNode && guidNode.textContent.startsWith('http')) {
                    itemLink = guidNode.textContent;
                }
    
    
                items.push({
                    title: iN.querySelector('title')?.textContent || 'N/A',
                    link: itemLink,
                    description: cleanDescription, // Puhdistettu kuvaus (käytetään esim. description-title)
                    fullContent: fullContentHTML,  // Voi sisältää HTML:ää (käytetään pääsisältönä)
                    pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
                    imageUrl: iN.querySelector('enclosure[type^="image/"]')?.getAttribute('url') || iN.querySelector('media\\:content[medium="image"]')?.getAttribute('url') || iN.querySelector('media\\:thumbnail')?.getAttribute('url'),
                    categories: Array.from(iN.querySelectorAll('category')).map(c => c.textContent.trim()).filter(Boolean),
                    feedOrigin,
                    sourceName: channelTitle,
                    copyright: copyright
                });
            });
            return items;
        } catch (e) { console.error(`DEBUG: Crit error news ${feedUrl}:`, e); return []; }
    }

    async function fetchAllNewsFeedsAndBuildSlider() {
        if (!slider) {
            console.error("DEBUG: CRITICAL - slider element not found in fetchAll!");
            return;
        }
        // Näytä latausindikaattori heti
        slider.innerHTML = `<div class="slide active placeholder-slide"><div class="news-item-placeholder-title">Ladataan uutisia...</div></div>`;
    
        allFeedItems = []; // Nollataan aina aluksi
        newsCounterForWeather = 0; // Nollaa myös säädian laskuri
    
        if (!userSettings.rssFeeds || userSettings.rssFeeds.length === 0) { // Tarkistetaan myös userSettings.rssFeeds olemassaolo
            console.log("DEBUG: No RSS feeds in userSettings to fetch.");
            slider.innerHTML = `<div class="slide active placeholder-slide"><div class="news-item-placeholder-title">Ei RSS-syötteitä</div><p>Lisää syötteitä asetuksista.</p></div>`;
            return;
        }
    
        try {
            console.log("DEBUG: Creating promises for feeds:", JSON.stringify(userSettings.rssFeeds));
            const promises = userSettings.rssFeeds.map(url => {
                console.log(`DEBUG: Mapping URL to promise: ${url}`);
                return fetchRSSForNews(url);
            });
    
            const results = await Promise.all(promises);
            console.log("DEBUG: Results from Promise.all (news):", results);
    
            let rawFeedItemsAggregated = []; // Alustetaan tässä skoopissa
            results.forEach(feedResultItems => {
                if (Array.isArray(feedResultItems)) {
                    rawFeedItemsAggregated.push(...feedResultItems);
                } else {
                    console.warn("DEBUG: Received non-array result for a news feed, skipping:", feedResultItems);
                }
            });
            console.log(`DEBUG: Total raw items aggregated: ${rawFeedItemsAggregated.length}`);
    
            // SUODATUS TÄSSÄ (käyttäen rawFeedItemsAggregated):
            allFeedItems = rawFeedItemsAggregated.filter(item => {
                // Varmistetaan, että item ja sen ominaisuudet ovat olemassa ennen trim()-kutsua
                const hasImage = item && item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '';
                const hasDescription = item && item.description && typeof item.description === 'string' && item.description.trim() !== '';
                
                // Suodatetaan pois, jos kuvaus puuttuu. Kuva on vapaaehtoinen.
                // Jos haluat vaatia myös kuvan, muuta ehto: return hasDescription && hasImage;
                return hasDescription; 
            });
            console.log(`DEBUG: Raw items from feeds: ${rawFeedItemsAggregated.length}, Filtered items (description required): ${allFeedItems.length}`);
    
            if (allFeedItems.length > 0) {
                allFeedItems.sort((a, b) => (b.pubDate?.getTime() || 0) - (a.pubDate?.getTime() || 0));
                buildNewsSlider();
            } else {
                // Tämä viesti näytetään, jos KAIKKI haetut uutiset suodattuvat pois
                // TAI jos syötteet olivat alun perin tyhjiä (mutta fetchRSSForNews palautti [])
                slider.innerHTML = `<div class="slide active placeholder-slide"><div class="news-item-placeholder-title">Ei uutisia löydetty</div><p>Kaikilta syötteiltä puuttui tarvittava sisältö (esim. kuvaus) tai syötteet olivat tyhjiä.</p></div>`;
            }
        } catch (error) {
            // Tämä catch on yleensä Promise.all:n virheille, jos jokin promisseista hylätään ilman,
            // että sen oma fetchRSSForNews:n catch-lohko palauttaa arvoa (vaikka sen pitäisi palauttaa []).
            console.error("DEBUG: Error in Promise.all or processing news results:", error);
            slider.innerHTML = `<div class="slide active placeholder-slide"><div class="news-item-placeholder-title">Virhe uutisia haettaessa</div></div>`;
        }
    }

    function buildNewsSlider() {
        if (!slider) { console.warn("DEBUG: slider element is null in buildNewsSlider"); return; }
        const animatedBg = slider.querySelector('.animated-background') || document.createElement('div');
        if (!slider.contains(animatedBg)) { animatedBg.className = 'animated-background'; slider.prepend(animatedBg); }
        Array.from(slider.querySelectorAll('.slide')).forEach(s => s.remove());
        newsCounterForWeather = 0;
    
        allFeedItems.forEach((currentItem) => { // Nimetään uudelleen selkeyden vuoksi: currentItem
            if (newsCounterForWeather > 0 && newsCounterForWeather % WEATHER_SLIDE_INTERVAL === 0) {
                createWeatherPlaceholderSlide();
            }
            // createNewsSlide kutsuu nyt suoraan oikeaa itemiä
            createNewsSlide(currentItem); // Välitetään currentItem
            newsCounterForWeather++;
        });
        currentSlideIndex = 0;
        if (slider.querySelectorAll('.slide').length > 0) { showNewsSlide(currentSlideIndex); startNewsAutoPlay(); }
    }
    
    function createNewsSlide(item) {
        if (!slider) return;
    
        const slideDiv = document.createElement('div');
        slideDiv.classList.add('slide', 'news-slide');
    
        // 1. Info Otsake
        const infoHeaderDiv = document.createElement('div');
        infoHeaderDiv.classList.add('news-item-info-header');
    
        if (item.feedOrigin) { // Käytetään feedOriginia faviconin hakuun
            const feedIconImg = document.createElement('img');
            feedIconImg.classList.add('feed-channel-logo');
            feedIconImg.src = `${item.feedOrigin}/favicon.ico`;
            feedIconImg.alt = `${item.sourceName || 'Lähde'} logo`;
            feedIconImg.onerror = () => { feedIconImg.style.display = 'none'; }; // Piilota, jos ei löydy
            infoHeaderDiv.appendChild(feedIconImg);
        }
    
        const channelTitleSpan = document.createElement('span');
        channelTitleSpan.classList.add('feed-channel-title');
        channelTitleSpan.textContent = item.sourceName || 'Tuntematon lähde';
        infoHeaderDiv.appendChild(channelTitleSpan);
    
        if (item.pubDate && !isNaN(item.pubDate.getTime())) {
            const channelTimeSpan = document.createElement('span');
            channelTimeSpan.classList.add('feed-channel-time');
            channelTimeSpan.textContent = `(${item.pubDate.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })})`;
            infoHeaderDiv.appendChild(channelTimeSpan);
        }
        slideDiv.appendChild(infoHeaderDiv);
    
    
        // 2. Uutisen Tagit (Kategoriat)
        if (item.categories && item.categories.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.classList.add('news-item-tags');
            item.categories.forEach(category => {
                const tagSpan = document.createElement('span');
                tagSpan.classList.add('category-tag-item'); // Uusi luokka erottamaan vanhasta
                tagSpan.textContent = category;
                tagsDiv.appendChild(tagSpan);
            });
            slideDiv.appendChild(tagsDiv);
        }
    
        // 3. Uutisen Pääotsikko
        const titleEl = document.createElement('h2');
        titleEl.classList.add('news-item-main-title'); // Uusi luokka
        titleEl.textContent = item.title;
        slideDiv.appendChild(titleEl);
    
        // 4. Sisältöalue (Kuva ja Teksti)
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('news-item-content-body'); // Uusi luokka
    
        if (item.imageUrl) {
            const imgEl = document.createElement('img');
            imgEl.classList.add('news-item-main-image'); // Uusi luokka
            imgEl.src = item.imageUrl;
            imgEl.alt = item.title.substring(0, 70);
            contentWrapper.appendChild(imgEl);
        }
    
        const textContentDiv = document.createElement('div');
        textContentDiv.classList.add('news-item-main-text'); // Uusi luokka
        // Näytetään koko kuvaus, ei lyhennetä. Sallitaan HTML, jos item.fullContent sisältää sitä.
        // Jos description on pelkkää tekstiä, käytä textContent.
        // Oletetaan, että item.description on puhdistettu teksti ja item.fullContent voi sisältää HTML:ää.
        if (item.fullContent && item.fullContent !== item.description) { // Jos fullContent on olemassa ja eri kuin pelkkä description
            const fullContentP = document.createElement('div'); // Käytä diviä, jos sisältää HTMLää
            fullContentP.innerHTML = item.fullContent;
            textContentDiv.appendChild(fullContentP);
        } else if (item.description) {
            const descriptionP = document.createElement('p');
            descriptionP.textContent = item.description;
            textContentDiv.appendChild(descriptionP);
        } else {
            const noDescP = document.createElement('p');
            noDescP.textContent = "Ei kuvausta saatavilla.";
            noDescP.style.fontStyle = "italic";
            textContentDiv.appendChild(noDescP);
        }
        contentWrapper.appendChild(textContentDiv);
        slideDiv.appendChild(contentWrapper);
    
    
        // 5. Meta-alatunniste
        const metaFooterDiv = document.createElement('div');
        metaFooterDiv.classList.add('news-item-meta-footer'); // Uusi luokka
    
        let metaFooterHTML = "";
        if (item.sourceName) {
            metaFooterHTML += `<span class="source-name-footer">Lähde: ${item.sourceName}</span>`;
        }
    
        // Käytä item.link uutisen linkkinä. item.guid voi olla muuta kuin URL.
        if (item.link && item.link !== '#') {
            metaFooterHTML += `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="source-link-footer">Lue alkuperäinen artikkeli 🔗</a>`;
        }
    
        if (item.copyright) {
            metaFooterHTML += `<span class="copyright-text-footer">© ${item.copyright}</span>`;
        }
        metaFooterDiv.innerHTML = metaFooterHTML;
        slideDiv.appendChild(metaFooterDiv);
    
        slider.appendChild(slideDiv);
    }

    function createWeatherPlaceholderSlide() {
        if (!slider) return;
        const slideDiv = document.createElement('div'); slideDiv.classList.add('slide', 'weather-slide');
        const placeholderContent = document.createElement('div');
        placeholderContent.classList.add('weather-placeholder');
        placeholderContent.innerHTML = `<h2>Sääennuste</h2><p>Säätiedot (${userSettings.location || 'ei sijaintia'}) latautuvat tähän...</p>`;
        slideDiv.appendChild(placeholderContent);
        slider.appendChild(slideDiv);
    }

    function showNewsSlide(index) {
        if (!slider) return; const slides = slider.querySelectorAll('.slide');
        if (!slides || slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        const targetIndex = index % slides.length;
        if (slides[targetIndex]) slides[targetIndex].classList.add('active');
    }
    function nextNewsSlide() {
        if (!slider) return; const slides = slider.querySelectorAll('.slide');
        if (!slides || slides.length === 0) return;
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        showNewsSlide(currentSlideIndex);
    }
    function startNewsAutoPlay() {
        clearInterval(slideInterval); if (!slider) return; const slides = slider.querySelectorAll('.slide');
        if (slides && slides.length > 1) {
            slideInterval = setInterval(nextNewsSlide, userSettings.slideDuration);
        } else if (slides.length === 1) { showNewsSlide(0); }
    }

    async function fetchPodcastFeedWithTimeout(feedUrl, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => { controller.abort(); console.warn(`DEBUG: Fetch aborted ${feedUrl} (timeout)`); }, timeoutMs);
        if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Haetaan syötettä...</li>';
        try {
            const response = await fetch(feedUrl, { signal: controller.signal }); clearTimeout(timeoutId);
            if (!response.ok) { if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = `<li>Virhe: ${response.statusText}.</li>`; return false; }
            const text = await response.text(); if (!text) { if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Tyhjä syöte.</li>'; return false; }
            if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Jäsennetään...</li>';
            const parser = new DOMParser(); const xmlDoc = parser.parseFromString(text, "application/xml");
            if (xmlDoc.querySelector('parsererror')) { if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>XML-virhe.</li>'; return false; }
            currentPodcastFeedTitle = xmlDoc.querySelector('channel > title')?.textContent || "Nimetön syöte"; // Aseta globaali
            podcastEpisodes = [];
            xmlDoc.querySelectorAll('channel > item').forEach(iN => {
                const enc = iN.querySelector('enclosure[url][type^="audio/"]');
                if (enc) podcastEpisodes.push({ title: iN.querySelector('title')?.textContent || 'N/A', audioUrl: enc.getAttribute('url') });
            });
            if (podcastEpisodesListUI) renderPodcastEpisodesList();
            return true;
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') { if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Aikakatkaisu.</li>'; }
            else { if (podcastEpisodesListUI) podcastEpisodesListUI.innerHTML = '<li>Virhe haussa.</li>'; }
            return false;
        }
    }

    function updateCurrentPodcastFeedDisplay(title, url) {
        if (currentPodcastFeedDisplay) { currentPodcastFeedDisplay.innerHTML = `Nykyinen: <span>${title || "Nimetön"}</span><br><small>${url || ''}</small>`; }
    }

    function renderPodcastEpisodesList(showAll = false) {
        if (!podcastEpisodesListUI) return;
        podcastEpisodesListUI.innerHTML = '';
        if (podcastEpisodes.length === 0) { podcastEpisodesListUI.innerHTML = '<li>Ei jaksoja.</li>'; return; }
        const episodesToDisplay = showAll ? podcastEpisodes : podcastEpisodes.slice(0, 5);
        episodesToDisplay.forEach((episode) => {
            const originalIndex = podcastEpisodes.indexOf(episode);
            const li = document.createElement('li'); li.textContent = episode.title;
            if (podcastAudioPlayer && originalIndex === currentPlayingEpisodeIndex && podcastAudioPlayer.src === episode.audioUrl && !podcastAudioPlayer.paused) {
                li.classList.add('playing');
            }
            li.addEventListener('click', () => playPodcastEpisode(originalIndex));
            podcastEpisodesListUI.appendChild(li);
        });
        if (!showAll && podcastEpisodes.length > 5) {
            const showMoreLi = document.createElement('li');
            showMoreLi.textContent = `Näytä kaikki (${podcastEpisodes.length}) jaksoa...`;
            showMoreLi.classList.add('show-more-episodes-btn');
            showMoreLi.addEventListener('click', () => renderPodcastEpisodesList(true));
            podcastEpisodesListUI.appendChild(showMoreLi);
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    function playPodcastEpisode(index, continueFromTime = 0) {
        if (!podcastAudioPlayer) return;
        if (index >= 0 && index < podcastEpisodes.length) {
            currentPlayingEpisodeIndex = index;
            const episode = podcastEpisodes[index];
            podcastAudioPlayer.src = episode.audioUrl;
            const setupAudioForPlayback = () => {
                if (podcastDurationTimeEl) podcastDurationTimeEl.textContent = formatTime(podcastAudioPlayer.duration);
                if (podcastProgressSlider) podcastProgressSlider.max = Math.floor(podcastAudioPlayer.duration);
                if (continueFromTime > 0 && podcastAudioPlayer.duration > continueFromTime) {
                    podcastAudioPlayer.currentTime = continueFromTime;
                }
                if (podcastCurrentTimeEl) podcastCurrentTimeEl.textContent = formatTime(podcastAudioPlayer.currentTime);
                if (podcastProgressSlider) podcastProgressSlider.value = Math.floor(podcastAudioPlayer.currentTime);
                podcastAudioPlayer.removeEventListener('loadedmetadata', setupAudioForPlayback);
            };
            podcastAudioPlayer.addEventListener('loadedmetadata', setupAudioForPlayback);
            podcastAudioPlayer.play()
                .then(() => {
                    if (podcastEpisodeTitleDisplay) podcastEpisodeTitleDisplay.textContent = episode.title;
                    if (podcastPlayPauseBtn) podcastPlayPauseBtn.innerHTML = '❚❚';
                    if (podcastPlayerContainer) podcastPlayerContainer.classList.remove('hidden');
                    lastPlayedAudioUrl = episode.audioUrl; localStorage.setItem('lastPlayedAudioUrl_cfoc_v2', lastPlayedAudioUrl);
                })
                .catch(e => { console.error("DEBUG: Play error:", e); });
            renderPodcastEpisodesList(podcastEpisodesListUI.querySelector('.show-more-episodes-btn') === null);
        }
    }

    if (podcastPlayPauseBtn && podcastAudioPlayer) {
        podcastPlayPauseBtn.addEventListener('click', () => {
            if (!podcastAudioPlayer.src || podcastAudioPlayer.readyState < 1) {
                if (podcastEpisodes.length > 0) {
                    const lastIndex = lastPlayedAudioUrl ? podcastEpisodes.findIndex(ep => ep.audioUrl === lastPlayedAudioUrl) : -1;
                    if (lastIndex !== -1 && lastPlayedAudioTime > 0) playPodcastEpisode(lastIndex, lastPlayedAudioTime);
                    else playPodcastEpisode(0);
                }
            } else if (podcastAudioPlayer.paused || podcastAudioPlayer.ended) {
                if (podcastAudioPlayer.readyState >= 2) podcastAudioPlayer.play().catch(e => console.error("DEBUG: Play() error:", e));
            } else { podcastAudioPlayer.pause(); }
        });
    }
    if (podcastPrevBtn && podcastAudioPlayer) {
        podcastPrevBtn.addEventListener('click', () => {
            if (currentPlayingEpisodeIndex > 0) playPodcastEpisode(currentPlayingEpisodeIndex - 1);
            else if (podcastEpisodes.length > 0) playPodcastEpisode(podcastEpisodes.length - 1);
        });
    }
    if (podcastNextBtn && podcastAudioPlayer) {
        podcastNextBtn.addEventListener('click', () => {
            if (currentPlayingEpisodeIndex < podcastEpisodes.length - 1) playPodcastEpisode(currentPlayingEpisodeIndex + 1);
            else if (podcastEpisodes.length > 0) playPodcastEpisode(0);
        });
    }

    if (podcastAudioPlayer) {
        podcastAudioPlayer.addEventListener('timeupdate', () => {
            if (podcastCurrentTimeEl) podcastCurrentTimeEl.textContent = formatTime(podcastAudioPlayer.currentTime);
            if (podcastProgressSlider) podcastProgressSlider.value = Math.floor(podcastAudioPlayer.currentTime);
            if (podcastAudioPlayer.currentTime > 0 && Math.floor(podcastAudioPlayer.currentTime) % 5 === 0 && podcastAudioPlayer.currentTime > (parseFloat(localStorage.getItem('lastSavedTimeUpdate_cfoc_v2') || 0) + 0.5)) {
                lastPlayedAudioTime = podcastAudioPlayer.currentTime;
                localStorage.setItem('lastPlayedAudioTime_cfoc_v2', lastPlayedAudioTime.toString());
                localStorage.setItem('lastSavedTimeUpdate_cfoc_v2', podcastAudioPlayer.currentTime.toString());
            }
        });
        podcastAudioPlayer.addEventListener('play', () => { if (podcastPlayPauseBtn) podcastPlayPauseBtn.innerHTML = '❚❚'; renderPodcastEpisodesList(podcastEpisodesListUI.querySelector('.show-more-episodes-btn') === null); });
        podcastAudioPlayer.addEventListener('pause', () => {
            if (podcastPlayPauseBtn) podcastPlayPauseBtn.innerHTML = '▶️';
            if (podcastAudioPlayer.currentTime > 0) {
                lastPlayedAudioTime = podcastAudioPlayer.currentTime;
                localStorage.setItem('lastPlayedAudioTime_cfoc_v2', lastPlayedAudioTime.toString());
                localStorage.setItem('lastSavedTimeUpdate_cfoc_v2', podcastAudioPlayer.currentTime.toString());
            }
            renderPodcastEpisodesList(podcastEpisodesListUI.querySelector('.show-more-episodes-btn') === null);
        });
        podcastAudioPlayer.addEventListener('ended', () => {
            if (podcastPlayPauseBtn) podcastPlayPauseBtn.innerHTML = '▶️';
            localStorage.removeItem('lastPlayedAudioTime_cfoc_v2'); localStorage.removeItem('lastSavedTimeUpdate_cfoc_v2');
            renderPodcastEpisodesList(podcastEpisodesListUI.querySelector('.show-more-episodes-btn') === null);
            if (podcastNextBtn) podcastNextBtn.click();
        });
        podcastAudioPlayer.addEventListener('error', (e) => { console.error("DEBUG: Audio Player Error Event:", e, podcastAudioPlayer.error); });
        podcastAudioPlayer.addEventListener('loadedmetadata', () => {
             if (podcastDurationTimeEl) podcastDurationTimeEl.textContent = formatTime(podcastAudioPlayer.duration);
             if (podcastProgressSlider) podcastProgressSlider.max = Math.floor(podcastAudioPlayer.duration);
        });
    }

    if (podcastProgressSlider && podcastAudioPlayer) {
        podcastProgressSlider.addEventListener('input', () => {
            if (podcastAudioPlayer.src && podcastAudioPlayer.readyState >= 2) {
                podcastAudioPlayer.currentTime = podcastProgressSlider.value;
            }
        });
    }

    function updateVolumeIcon() {
        if (!volumeIcon || !podcastAudioPlayer) return;
        if (podcastAudioPlayer.muted || podcastAudioPlayer.volume === 0) volumeIcon.innerHTML = '🔇';
        else if (podcastAudioPlayer.volume < 0.5) volumeIcon.innerHTML = '🔉';
        else volumeIcon.innerHTML = '🔊';
    }

    if (volumeIcon && podcastAudioPlayer) {
        volumeIcon.addEventListener('click', () => {
            podcastAudioPlayer.muted = !podcastAudioPlayer.muted;
            userSettings.isMuted = podcastAudioPlayer.muted;
            if (!podcastAudioPlayer.muted && podcastAudioPlayer.volume === 0) {
                podcastAudioPlayer.volume = 0.1; userSettings.volume = 0.1;
                if(podcastVolumeSlider) podcastVolumeSlider.value = 0.1;
            }
            saveAppSettings(); updateVolumeIcon();
        });
    }

    if (podcastVolumeSlider && podcastAudioPlayer) {
        podcastVolumeSlider.addEventListener('input', (e) => {
            const newVolume = parseFloat(e.target.value);
            podcastAudioPlayer.volume = newVolume; userSettings.volume = newVolume;
            podcastAudioPlayer.muted = newVolume === 0; userSettings.isMuted = podcastAudioPlayer.muted;
            saveAppSettings(); updateVolumeIcon();
        });
    }

    window.addEventListener('beforeunload', () => {
        if (podcastAudioPlayer && podcastAudioPlayer.src && podcastAudioPlayer.currentTime > 0 && !podcastAudioPlayer.paused) {
            localStorage.setItem('lastPlayedAudioUrl_cfoc_v2', podcastAudioPlayer.src);
            localStorage.setItem('lastPlayedAudioTime_cfoc_v2', podcastAudioPlayer.currentTime.toString());
        }
    });

    // --- Alustus ---
    function initializePage() {
        console.log("DEBUG: Initializing page full logic...");
        loadSettings();
        updateLocalTime(); // Kutsutaan kerran heti, jotta aika näkyy välittömästi
        setInterval(updateLocalTime, 1000); // Käynnistä intervalli päivittämään aikaa joka sekunti
        if (currentYearDashboardEl) currentYearDashboardEl.textContent = new Date().getFullYear().toString();
        if (rssFeedsListUI) renderNewsFeedsList();
        fetchAllNewsFeedsAndBuildSlider();
        setInterval(fetchAllNewsFeedsAndBuildSlider, FEED_REFRESH_INTERVAL);
        if (currentPodcastFeedDisplay) updateCurrentPodcastFeedDisplay(userSettings.podcastFeedTitle, userSettings.podcastFeedUrl);
        if (userSettings.podcastFeedUrl && podcastEpisodesListUI && podcastAudioPlayer) {
            fetchPodcastFeedWithTimeout(userSettings.podcastFeedUrl, 20000).then(success => {
                if (success && lastPlayedAudioUrl) {
                    const episodeToContinueIndex = podcastEpisodes.findIndex(ep => ep.audioUrl === lastPlayedAudioUrl);
                    if (episodeToContinueIndex !== -1 && lastPlayedAudioTime > 0) {
                        currentPlayingEpisodeIndex = episodeToContinueIndex;
                        const episode = podcastEpisodes[episodeToContinueIndex];
                        podcastAudioPlayer.src = episode.audioUrl;
                        const initialAudioSetup = () => {
                            if (podcastDurationTimeEl) podcastDurationTimeEl.textContent = formatTime(podcastAudioPlayer.duration);
                            if (podcastProgressSlider) podcastProgressSlider.max = Math.floor(podcastAudioPlayer.duration);
                            if (lastPlayedAudioTime > 0 && lastPlayedAudioTime < podcastAudioPlayer.duration) {
                                podcastAudioPlayer.currentTime = lastPlayedAudioTime;
                            }
                            if (podcastCurrentTimeEl) podcastCurrentTimeEl.textContent = formatTime(podcastAudioPlayer.currentTime);
                            if (podcastProgressSlider) podcastProgressSlider.value = Math.floor(podcastAudioPlayer.currentTime);
                            podcastAudioPlayer.removeEventListener('loadedmetadata', initialAudioSetup);
                        };
                        podcastAudioPlayer.addEventListener('loadedmetadata', initialAudioSetup);
                        if (podcastEpisodeTitleDisplay) podcastEpisodeTitleDisplay.textContent = episode.title;
                        if (podcastPlayerContainer) podcastPlayerContainer.classList.remove('hidden');
                        renderPodcastEpisodesList();
                    } else if (podcastPlayerContainer) { podcastPlayerContainer.classList.add('hidden'); }
                } else if (podcastPlayerContainer) { podcastPlayerContainer.classList.add('hidden'); }
            }).catch(error => {
                console.error("DEBUG: Error initializing podcast feed from storage:", error);
                if (podcastPlayerContainer) podcastPlayerContainer.classList.add('hidden');
            });
        } else if (podcastPlayerContainer) {
            podcastPlayerContainer.classList.add('hidden');
        }
        console.log("DEBUG: Page full initialization complete.");
    }

    initializePage();
});