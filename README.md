[![Build Status](https://travis-ci.org/cfn-modules/alerting.svg?branch=master)](https://travis-ci.org/cfn-modules/alerting)
[![NPM version](https://img.shields.io/npm/v/@cfn-modules/alerting.svg)](https://www.npmjs.com/package/@cfn-modules/alerting)

# cfn-modules: Alerting

Central SNS topic that receives alerts from other [modules](https://www.npmjs.com/org/cfn-modules) and forwards them to your team via email, HTTP, or HTTPS.

## Install

> Install [Node.js and npm](https://nodejs.org/) first!

```
npm i @cfn-modules/alerting
```

## Usage

```
---
AWSTemplateFormatVersion: '2010-09-09'
Description: 'cfn-modules example'
Resources:
  Alerting:
    Type: 'AWS::CloudFormation::Stack'
    Properties:
      Parameters:
        Email: 'team@org.com' # optional
        HttpEndpoint: 'http://org.com/webhook' # optional
        HttpsEndpoint: 'https://org.com/webhook' # optional
        FallbackEmail: 'user@org.net' # optional
      TemplateURL: './node_modules/@cfn-modules/alerting/module.yml'
```

## Parameters

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
      <th>Default</th>
      <th>Required?</th>
      <th>Allowed values</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Email</td>
      <td>Email address that will receive alerts</td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
    <tr>
      <td>HttpEndpoint</td>
      <td>HTTP endpoint that will receive alerts via POST requests</td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
    <tr>
      <td>HttpsEndpoint</td>
      <td>HTTPS endpoint that will receive alerts via POST requests (can be a marbot.io endpoint)</td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
    <tr>
      <td>FallbackEmail</td>
      <td>Email address that will receive alerts if alerts can not be delivered</td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
  </tbody>
</table>
