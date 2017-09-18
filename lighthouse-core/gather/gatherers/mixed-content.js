/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer');
const DOMHelpers = require('../../lib/dom-helpers.js');

/**
 * This gatherer sets the Network requestInterceptor so that we can
 * capture all requests, change them to HTTPS, and pass them along. In the audit
 * we try to determine what mixed content is able to switch to HTTPS and which
 * isn't.
 * TODO: fix network interceptor and place the HTTPS version of the url into url.
 * To the best of my knowledge it isn't
 * actually intercepting, but this is the general gist of how you want to do it.
 */

class MixedContent extends Gatherer {

  constructor() {
    super();
    this._preRedirectURL = undefined;
  }

  beforePass(options) {
    this._preRedirectURL = options.url;
    //options.url = this._preRedirectURL.replace(/^https/, 'http');
    options.driver.sendCommand('Network.setRequestInterceptionEnabled', {enabled: true});

    options.driver.on('Network.requestIntercepted', (interceptionId, request) => {
      options.driver.sendCommand('Network.continueInterceptedRequest', {
        interceptionId,
        url: 'google.com',
      });    
    });
  }

  afterPass(options, traceData) {
	const driver = this.driver = options.driver;
    return {};
    //return indexedNetworkRecords = traceData.networkRecords.filter(record => {
    //  if (record.finished) {
    //    map[record._url] = {
    //      url: record.url,
    //      mimeType: record._mimeType
    //    };
    //  }
    //  return map;
    //}, {});
  }
}

module.exports = MixedContent;
