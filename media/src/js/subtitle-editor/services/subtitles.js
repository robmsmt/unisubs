// Amara, universalsubtitles.org
//
// Copyright (C) 2012 Participatory Culture Foundation
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see
// http://www.gnu.org/licenses/agpl-3.0.html.

/*
 * We store a local cache of language data + subtitles in the following format:
 * [
 *   {
 *      "code": "en",
 *      "editingLanguage": true,
 *      "versions": [
 *        {
 *          "title": "About Amara",
 *          "number": 4,
 *          "subtitlesXML": "<dfxp subs>",
 *          "description": "<some description>"
 *        }
 *      ],
 *      "numVersions": 1,
 *      "translatedFrom": {
 *        "version_number": 3,
 *        "language_code": "en"
 *      },
 *      "pk": 1,
 *      "name": "English"
 *   }
 * ]
 *
 * When you request a set of subtitles the api is hit if data is not yet on
 * the cache.
 */

(function() {

    var root, module, getAPIUrl;

    root = this;
    module = angular.module('amara.SubtitleEditor.services', []);

    getAPIUrl = function(videoId, languageCode, versionNumber) {
        var url = '/api2/partners/videos/' + videoId +
            '/languages/' + languageCode + '/subtitles/?format=dfxp';

        if (versionNumber) {
            url = url + '&version=' + versionNumber;
        }

        return url;

    };

    module.factory("SubtitleStorage", function($http) {
        var cachedData = window.editorData;

        return {

            /**
             * Tries to find the data in an in memory, if it's not there
             * fetch from the server side.
             * @param languageCode
             * @param versionNumber
             * @param callback Function to be called with the dfxp xlm
             * once it's ready.
             */
            getSubtitles: function(languageCode, versionNumber, callback){
                if (!languageCode) {
                    throw Error("You have to give me a languageCode");
                }

                var subtitlesXML;
                // will trigger a subtitlesFetched event when ready
                for (var i=0; i < cachedData.languages.length ; i++){
                    var langObj = cachedData.languages[i];
                    if (langObj.code == languageCode){
                        for (var j = 0; j < langObj.versions.length ; j++){
                            if (langObj.versions[j].number == versionNumber){
                                subtitlesXML = langObj.versions[j].subtitlesXML;
                                break;
                            }
                        }
                        break;
                    }
                }
                if (subtitlesXML !== undefined){
                   callback(subtitlesXML);
                } else {
                    // fetch data
                    var url = getAPIUrl(cachedData.video.id, languageCode,
                                        versionNumber);

                    $http.get(url).success(function(response) {
                        // TODO: Cache this
                        callback(response);
                    });
                }
            },
            saveSubtitles: function(videoID, languageCode, dfxpString){
                // first we should save those subs locally
                //
            }
        };
    });

    /**
     * Since we might have more than one subtitle list components on the
     * page (e.g. one for editing, the other is the reference one), we
     * need a way to identify / find them. For example, when changing the
     * reference language, the selector must know how which of the components
     * to update.
     */
    module.factory("SubtitleListFinder", function($http) {
        var registry = {};

        return {

            /**
             * Add to the registry what subtitle list should be found
             * when refered by this name.  Registring the same name more
             * than once will throw an error
             * @param name  String to identify this subtitle list by, this is taken from the
             * value of the 'subtitle-list' attribute on the SubtitleList directive
             * @param elm The wrapped element for the subtitle list.
             * @param controller Controller for the the subtitle list
             * @param scope The scope for the list
             */
            register: function(name, elm, controller, scope){
                if(registry[name]) {
                    // not sure we want to error on this, but let's be cautious until
                    // we are sure
                   throw new Error("Already registred a subtitle list component with name'" + name + "'") ;
                }
                registry[name] = {
                    name: name,
                    elm: elm,
                    controller: controller,
                    scope: scope
                };
                return this;
            },
            get: function(name){
                return registry[name];
            }
        };
    });
}).call(this);
