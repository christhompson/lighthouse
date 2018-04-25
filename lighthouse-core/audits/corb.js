/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audit a page to find resources that should be improved for
 * Cross-Origin Read Blocking.
 */
'use strict';

const Audit = require('./audit');
const URL = require('../lib/url-shim');
const Util = require('../report/html/renderer/util');

/**
 * TODO: Explain what the audit is measuring, and replace the placeholder
 * descriptions and help text.
 */
class CrossOriginReadBlocking extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      name: 'corb',
      informative: true,
      description: 'All same-origin responses are correctly typed or set as nosniff',
      failureDescription: 'Some same-origin responses may not be correctly blocked by ' +
          'Cross-Origin Read Blocking',
      helpText:
        'Cross-Origin Read Blocking can help protect your site\'s sensitive resources. Ensuring ' +
        'your resources are served with the correct content types is a pre-requisite.',
      requiredArtifacts: ['devtoolsLogs', 'URL'],
    };
  }

  /**
   * @param {LH.WebInspector.NetworkRequest} record
   * @return boolean
   */
  static isNosniffRecord(record) {
    return (record._responseHeaders || []).findIndex(header =>
      header && header.name.toLowerCase() === 'X-Content-Type-Options'
        && header.value.toLowerCase() === 'nosniff'
    ) !== -1;
  }

  /**
   * @param {LH.WebInspector.NetworkRequest} record
   * @return boolean
   */
  static isDocumentRecord(record) {
    return record._resourceType && record._resourceType.name() === 'Document';
  }

  /**
   * @param {LH.WebInspector.NetworkRequest} record
   * @param {string} mainUrl
   * @return boolean
   */
  static isSameOriginRecord(record, mainUrl) {
    return URL.originsMatch(new URL(record.url), new URL(mainUrl));
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const finalUrl = artifacts.URL.finalUrl;
    return artifacts.requestNetworkRecords(devtoolsLogs).then(networkRecords => {
      const blockableRecords = networkRecords.filter(
          record => !CrossOriginReadBlocking.isNosniffRecord(record)
          && CrossOriginReadBlocking.isDocumentRecord(record)
          && CrossOriginReadBlocking.isSameOriginRecord(record, finalUrl));

      let displayValue = '';
      if (blockableRecords.length > 0) {
        displayValue = `${Util.formatNumber(blockableRecords.length)}
          ${blockableRecords.length === 1 ? 'resource' : 'resources'}`;
      }
      const headings = [
        {key: 'url', itemType: 'url', text: 'URL'},
      ];
      const details = Audit.makeTableDetails(headings, blockableRecords);
      // TODO: Come up with a real numerical scoring metric.
      const score = 1 / (blockableRecords + 1);

      return {
        rawValue: blockableRecords.length === 0,
        score,
        displayValue: displayValue,
        details,
      };
    });
  }
}

module.exports = CrossOriginReadBlocking;

