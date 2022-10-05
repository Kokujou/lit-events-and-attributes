import { CheckboxState } from '../../data/enumerations/checkbox-state.js';
import { MoodColors } from '../../data/enumerations/mood.js';
import { MusicSortingProperties } from '../../data/music-sorting-properties.js';
import { html } from '../../exports.js';
import {
    Instrumentation,
    InstrumentType,
    Mood,
    MusicGenre,
    Nation,
    Participants,
} from '../../obscuritas-media-manager-backend-client.js';
import { IconRegistry } from '../../resources/icons/icon-registry.js';
import { getKeyFor } from '../../services/extensions/object.extensions.js';
import { MusicFilter } from './music-filter.js';

/**
 * @param {MusicFilter} musicFilter
 */
export function renderMusicFilter(musicFilter) {
    return html`
        <div id="search-heading">
            <div class="heading-label">Suche</div>
            <div
                class="icon-button ${IconRegistry.RevertIcon}"
                @click="${/** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () => musicFilter.resetAllFilters()}"
            ></div>
        </div>
        <div id="search-panel">
            <div id="text-filter" class="filter">
                <input
                    type="text"
                    id="search-input"
                    placeholder="Suchbegriff eingeben..."
                    oninput="this.dispatchEvent(new Event('change'))"
                    @change="${
                        /** crLLhgJ2zR @type {(e:Event)=>void} */ (e) =>
                            musicFilter.toggleFilter('search', '', e.dsa.value)
                    }"
                    .value="${musicFilter.filter.search || ''}"
                />
            </div>
            <div id="complete-filter" class="filter">
                <label for="scales">Vollständig: </label>
                <tri-value-checkbox
                    allowThreeValues
                    id="complete-input"
                    value="${musicFilter.filter.complete}"
                    @valueChanged="${
                        /** crLLhgJ2zR @param {(e:CustomEvent<any>)=>void} e*/ (e) =>
                            musicFilter.toggleFilter('complete', '', e.gar.value)
                    }"
                ></tri-value-checkbox>
            </div>
            <div id="mood-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Sortieren:</div>
                    <div
                        class="icon-button ${IconRegistry.RevertIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () => musicFilter.changeSorting('unset')
                        }"
                    ></div>
                </div>
                <div id="sorting-container">
                    <drop-down
                        .value="${MusicSortingProperties[musicFilter.sortingProperty]}"
                        maxDisplayDepth="5"
                        .options="${Object.values(MusicSortingProperties)}"
                        @selectionChange="${
                            /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                                musicFilter.changeSorting(getKeyFor(MusicSortingProperties, e.detail.value))
                        }"
                    >
                    </drop-down>
                    <div
                        id="ascending-icon"
                        ?active="${musicFilter.sortingDirection == 'ascending'}"
                        class="icon-button ${IconRegistry.AscendingIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.changeSorting(null, 'ascending')
                        }"
                    ></div>
                    <div
                        id="descending-icon"
                        ?active="${musicFilter.sortingDirection == 'descending'}"
                        class="icon-button ${IconRegistry.DescendingIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.changeSorting(null, 'descending')
                        }"
                    ></div>
                </div>
            </div>
            <div id="language-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Sprache:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('languages', CheckboxState.Allow)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('languages', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <side-scroller>
                    ${Object.values(Nation).map(
                        (type) =>
                            html` <tri-value-checkbox
                                @valueChanged="${
                                    /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                                        musicFilter.toggleFilter('languages', type, e.detail.value)
                                }"
                                class="icon-container"
                                .value="${musicFilter.filter.languages.states[type]}"
                            >
                                <div class="inline-icon ${type}"></div>
                            </tri-value-checkbox>`
                    )}
                </side-scroller>
            </div>
            <div id="nation-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Herkunftsland:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('nations', CheckboxState.Allow)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('nations', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <side-scroller>
                    ${Object.values(Nation).map(
                        (type) =>
                            html` <tri-value-checkbox
                                class="icon-container"
                                @valueChanged="${
                                    /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                                        musicFilter.toggleFilter('nations', type, e.detail.value)
                                }"
                                .value="${musicFilter.filter.nations.states[type]}"
                            >
                                <div class="inline-icon ${type}"></div>
                            </tri-value-checkbox>`
                    )}
                </side-scroller>
                <div id="instrument-type-filter" class="filter">
                    <div class="filter-heading">
                        <div class="heading-label">Instrument Typen:</div>
                        <div
                            class="icon-button ${IconRegistry.SelectAllIcon}"
                            @click="${
                                /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                    musicFilter.setArrayFilter('instrumentTypes', CheckboxState.Allow)
                            }"
                        ></div>
                        <div
                            class="icon-button ${IconRegistry.UnselectAllIcon}"
                            @click="${
                                /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                    musicFilter.setArrayFilter('instrumentTypes', CheckboxState.Forbid)
                            }"
                        ></div>
                        <div
                            class="icon-button ${IconRegistry.RevertIcon}"
                            @click="${
                                /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                    musicFilter.setArrayFilter('instrumentTypes', CheckboxState.Ignore)
                            }"
                        ></div>
                    </div>
                    <side-scroller>
                        ${Object.values(InstrumentType).map(
                            (type) =>
                                html` <tri-value-checkbox
                                    class="icon-container"
                                    allowThreeValues
                                    @valueChanged="${
                                        /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                                            musicFilter.toggleFilter('instrumentTypes', type, e.detail.value)
                                    }"
                                    .value="${musicFilter.filter.instrumentTypes.states[type]}"
                                    .disabled="${!musicFilter.canFilterInstrumentType(type)}"
                                >
                                    <div class="inline-icon ${type}"></div>
                                </tri-value-checkbox>`
                        )}
                    </side-scroller>
                </div>
            </div>
            <div id="instrument-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Instrumente:</div>
                    <div
                        class="icon-button ${IconRegistry.PopupIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () => musicFilter.showInstrumentFilterPopup()
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('instruments', CheckboxState.Allow)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('instruments', CheckboxState.Forbid)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.RevertIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('instruments', CheckboxState.Ignore)
                        }"
                    ></div>
                </div>
            </div>
            <div id="rating-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Bewertung:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('ratings', CheckboxState.Allow)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('ratings', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <star-rating
                    max="5"
                    .values="${Object.keys(musicFilter.filter.ratings.states)
                        .filter((x) => musicFilter.filter.ratings.states[x] == CheckboxState.Allow)
                        .map((x) => Number.parseInt(x))}"
                    @ratingChanged="${
                        /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                            musicFilter.toggleFilter(
                                'ratings',
                                `${e.detail.rating}`,
                                e.detail.include ? CheckboxState.Allow : CheckboxState.Forbid
                            )
                    }"
                ></star-rating>
            </div>
            <div id="mood-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Stimmung:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('moods', CheckboxState.Ignore)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('moods', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <drop-down
                    @selectionChange="${
                        /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                            musicFilter.handleDropdownChange('moods', e.detail.value)
                    }"
                    .values="${Object.keys(musicFilter.filter.moods.states).filter(
                        (key) => musicFilter.filter.moods.states[key] == CheckboxState.Ignore
                    )}"
                    multiselect
                    maxDisplayDepth="5"
                    .options="${Object.values(Mood)}"
                    .colors="${MoodColors}"
                >
                </drop-down>
            </div>
            <div id="genre-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">genres:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('genres', CheckboxState.Ignore)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('genres', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <drop-down
                    @selectionChange="${
                        /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                            musicFilter.handleDropdownChange('genres', e.detail.value)
                    }"
                    .values="${Object.keys(musicFilter.filter.genres.states).filter(
                        (key) => musicFilter.filter.genres.states[key] == CheckboxState.Ignore
                    )}"
                    multiselect
                    maxDisplayDepth="5"
                    .options="${Object.values(MusicGenre)}"
                >
                </drop-down>
            </div>
            <div id="instrumentation-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Instrumentverteilung:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('instrumentations', CheckboxState.Ignore)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('instrumentations', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <drop-down
                    @selectionChange="${
                        /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                            musicFilter.handleDropdownChange('instrumentations', e.detail.value)
                    }"
                    .values="${Object.keys(musicFilter.filter.instrumentations.states).filter(
                        (key) => musicFilter.filter.instrumentations.states[key] == CheckboxState.Ignore
                    )}"
                    multiselect
                    maxDisplayDepth="5"
                    .options="${Object.values(Instrumentation)}"
                >
                </drop-down>
            </div>
            <div id="participant-count-filter" class="filter">
                <div class="filter-heading">
                    <div class="heading-label">Mitgliederzahl:</div>
                    <div
                        class="icon-button ${IconRegistry.SelectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('participants', CheckboxState.Allow)
                        }"
                    ></div>
                    <div
                        class="icon-button ${IconRegistry.UnselectAllIcon}"
                        @click="${
                            /** crLLhgJ2zR @type {(e:MouseEvent)=>void} */ () =>
                                musicFilter.setArrayFilter('participants', CheckboxState.Forbid)
                        }"
                    ></div>
                </div>
                <side-scroller>
                    ${Object.values(Participants).map(
                        (type) =>
                            html` <tri-value-checkbox
                                class="icon-container"
                                @valueChanged="${
                                    /** crLLhgJ2zR @type {(e:CustomEvent<any>)=>void} */ (e) =>
                                        musicFilter.toggleFilter('participants', type, e.detail.value)
                                }"
                                .value="${musicFilter.filter.participants.states[type]}"
                            >
                                <div class="inline-icon ${type}"></div>
                            </tri-value-checkbox>`
                    )}
                </side-scroller>
            </div>
        </div>
    `;
}
