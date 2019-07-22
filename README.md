[![Build Status](https://travis-ci.org/cfn-modules/cloudwatch-dashboard.svg?branch=master)](https://travis-ci.org/cfn-modules/cloudwatch-dashboard)
[![NPM version](https://img.shields.io/npm/v/@cfn-modules/cloudwatch-dashboard.svg)](https://www.npmjs.com/package/@cfn-modules/cloudwatch-dashboard)

# cfn-modules: CloudWatch Dashboard

CloudWatch dashboard for ALB, Fargate Service, and RDS Aurora Serverless

## Install

> Install [Node.js and npm](https://nodejs.org/) first!

```
npm i @cfn-modules/cloudwatch-dashboard
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
        DashboardName: 'My Dashboard'
        AlbModule: !GetAtt 'Alb.Outputs.StackName' # optional
        FargateServiceModule: !GetAtt 'FargateService.Outputs.StackName'
        RdsAuroraServerlessModule: !GetAtt 'RdsAuroraServerless.Outputs.StackName'
      TemplateURL: './node_modules/@cfn-modules/cloudwatch-dashboard/module.yml'
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
      <td>DashboardName</td>
      <td>The name for the dashboard</td>
      <td></td>
      <td>yes</td>
      <td></td>
    </tr>
    <tr>
      <td>AlbModule</td>
      <td>Stack name of <a href="https://www.npmjs.com/package/@cfn-modules/alb">alb module</a></td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
    <tr>
      <td>FargateServiceModule</td>
      <td>Stack name of <a href="https://www.npmjs.com/package/@cfn-modules/fargate-service">fargate-service module</a></td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
    <tr>
      <td>RdsAuroraServerlessModule</td>
      <td>Stack name of <a href="https://www.npmjs.com/package/@cfn-modules/rds-aurora-serverles">rds-aurora-serverles module</a></td>
      <td></td>
      <td>no</td>
      <td></td>
    </tr>
  </tbody>
</table>
