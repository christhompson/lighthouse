/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const URL = require('../lib/url-shim');
const Util = require('../report/v2/renderer/util');


const SECURE_SCHEMES = ['data', 'https', 'wss', 'blob', 'chrome', 'chrome-extension'];
const SECURE_DOMAINS = ['localhost', '127.0.0.1'];

class MixedContent extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Mixed Content',
      name: 'mixed-content',
      description: 'MIXED CONTENT',
      failureDescription: 'MIXED CONTENT',
      helpText: 'Test help text here.',
      //requiredArtifacts: ['MixedContent']
      requiredArtifacts: ['MixedContent', 'devtoolsLogs']
    };
  }
  /**
   * @param {{scheme: string, domain: string}} record
   * @return {boolean}
   */
  static isSecureRecord(record) {
    return SECURE_SCHEMES.includes(record.scheme) ||
           SECURE_SCHEMES.includes(record.protocol) ||
           SECURE_DOMAINS.includes(record.domain);
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const devtoolsLogs = artifacts.devtoolsLogs[Audit.MIXED_CONTENT_PASS];
    return artifacts.requestNetworkRecords(devtoolsLogs).then(networkRecords => {
      //const insecureRecords = networkRecords
      //    .filter(record => !MixedContent.isSecureRecord(record))
      //    .map(record => ({url: URL.elideDataURI(record.url)}));

      const secureRecords = networkRecords
          .filter(record => MixedContent.isSecureRecord(record))
          .map(record => ({url: URL.elideDataURI(record.url)}));

      //let displayValue = '';
      //if (insecureRecords.length > 1) {
      //  displayValue = `${Util.formatNumber(insecureRecords.length)} insecure requests found,\
      //        ${Util.formatNumber(secureRecords.length)} secure requests found`;
      //} else if (insecureRecords.length === 1) {
      //  displayValue = `${insecureRecords.length} insecure request found`;
      //}

      let displayValue = '';
      if (secureRecords.length > 1) {
        displayValue = `${Util.formatNumber(secureRecords.length)} secure requests found`;
      } else if (secureRecords.length === 1) {
        displayValue = `${secureRecords.length} secure request found`;
      }

      return {
        rawValue: secureRecords.length !== 0,
        displayValue,
        extendedInfo: {
          value: secureRecords
        },
        //details: {
        //  type: 'list',
        //  header: {type: 'text', text: 'Insecure URLs:'},
        //  items: insecureRecords.map(record => ({type: 'url', text: record.url})),
        //},
        details: {
          type: 'list',
          header: {type: 'text', text: 'Secure URLs:'},
          items: secureRecords.map(record => ({type: 'url', text: record.url})),
        },
      };
    });
  }
}

module.exports = MixedContent;
