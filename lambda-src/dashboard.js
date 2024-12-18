const { CloudWatchClient, PutDashboardCommand, DeleteDashboardsCommand } = require('@aws-sdk/client-cloudwatch');
const cloudwatch = new CloudWatchClient({apiVersion: '2010-08-01'});

async function cfnCustomResourceSuccess(event, physicalResourceId, optionalData) {
  const response = await fetch(event.ResponseURL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Status: 'SUCCESS',
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      ...(optionalData !== undefined && {Data: optionalData})
    })
  });
  if (response.status !== 200) {
    console.log('response status', response.status);
    console.log('response', await response.text());
    throw new Error('unexpected status code');
  }
}

async function cfnCustomResourceFailed(event, physicalResourceId, optionalReason) {
  const response = await fetch(event.ResponseURL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Status: 'FAILED',
      ...(optionalReason !== undefined && {Reason: optionalReason}),
      PhysicalResourceId: (physicalResourceId === undefined || physicalResourceId === null) ? event.LogicalResourceId : physicalResourceId, // physicalResourceId might not be available if create fails 
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId
    })
  });
  if (response.status !== 200) {
    console.log('response status', response.status);
    console.log('response', await response.text());
    throw new Error('unexpected status code');
  }
}

function generateDashboard(event) {
  let widgets = [];
  if (event.ResourceProperties.AlbFullName) {
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          [{expression: '(m5lb+m5tg)/r*100', label: '5XX', id: 'm5r'}],
          [{expression: '(m4lb+m4tg)/r*100', label: '4XX', id: 'm4r'}],
          ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', event.ResourceProperties.AlbFullName, {stat: 'Sum', id: 'r', visible: false}],
          ['.', 'HTTPCode_ELB_5XX_Count', '.', '.', {stat: 'Sum', id: 'm5lb', visible: false}],
          ['.', 'HTTPCode_ELB_4XX_Count', '.', '.', {stat: 'Sum', id: 'm4lb', visible: false}],
          ['.', 'HTTPCode_Target_5XX_Count', '.', '.', {stat: 'Sum', id: 'm5tg', visible: false}],
          ['.', 'HTTPCode_Target_4XX_Count', '.', '.', {stat: 'Sum', id: 'm4tg', visible: false}]
        ],
        view: 'timeSeries',
        region: event.ResourceProperties.Region,
        title: 'ALB Errors',
        yAxis: {
          left: {
            showUnits: false,
            label: 'Error Rate'
          },
          right: {
            showUnits: false
          }
        }
      }
    });
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/ApplicationELB', 'TargetResponseTime', 'LoadBalancer', event.ResourceProperties.AlbFullName, {stat: 'p99', label: '99 PCTL'}],
          ['...', {'stat': 'p95', 'label': '95 PCTL' }],
          [{expression: 'SUM(METRICS(\"req\"))/60/5', label: 'Requests', id: 'reqs', yAxis: 'right'}],
          ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', event.ResourceProperties.AlbFullName, {stat: 'Sum', id: 'req', visible: false }]
        ],
        view: 'timeSeries',
        stacked: true,
        region: event.ResourceProperties.Region,
        title: 'ALB Requests + Latency',
        period: 300
      }
    });
  }
  if (event.ResourceProperties.FargateServiceName) {
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/ECS', 'MemoryUtilization', 'ServiceName', event.ResourceProperties.FargateServiceName, 'ClusterName', event.ResourceProperties.FargateServiceClusterName, {stat: 'Maximum', label: 'Memory'}],
          ['.', 'CPUUtilization', '.', '.', '.', '.', {stat: 'Maximum', label: 'CPU'}]
        ],
        view: 'timeSeries',
        stacked: true,
        region: event.ResourceProperties.Region,
        title: 'ECS Utilization'
      }
    });
  }
  if (event.ResourceProperties.RdsClusterName) {
    widgets.push({
      type: 'metric',
      properties: {
         metrics: [
          ['AWS/RDS', 'VolumeReadIOPs', 'DBClusterIdentifier', event.ResourceProperties.RdsClusterName, {stat: 'Maximum'}],
          ['.', 'VolumeWriteIOPs', '.', '.', {'stat': 'Maximum'}],
          ['.', 'ServerlessDatabaseCapacity', '.', '.', {stat: 'Maximum', yAxis: 'right'}]
         ],
         view: 'timeSeries',
         region: event.ResourceProperties.Region,
         title: 'RDS IOPS + Capacity'
      }
    });
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/RDS', 'DeleteLatency', 'DBClusterIdentifier', event.ResourceProperties.RdsClusterName, {stat: 'p95', label: 'Delete'}],
          ['.', 'InsertLatency', '.', '.', {'stat': 'p95', 'label': 'Insert'}],
          ['.', 'SelectLatency', '.', '.', {'stat': 'p95', 'label': 'Select'}],
          ['.', 'UpdateLatency', '.', '.', {'stat': 'p95', 'label': 'Update'}]
        ],
        'view': 'timeSeries',
        'stacked': true,
        region: event.ResourceProperties.Region,
        'title': 'RDS Latency'
      }
    });
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          [ "AWS/RDS", "Queries", "DBClusterIdentifier", event.ResourceProperties.RdsClusterName, { "stat": "Maximum", "label": "All", "yAxis": "right" } ],
          [ ".", "SelectThroughput", ".", ".", { "stat": "Maximum", "label": "Select" } ],
          [ ".", "InsertThroughput", ".", ".", { "stat": "Maximum", "label": "Insert" } ],
          [ ".", "UpdateThroughput", ".", ".", { "stat": "Maximum", "label": "Update" } ],
          [ ".", "DeleteThroughput", ".", ".", { "stat": "Maximum", "label": "Delete" } ]
        ],
        'view': 'timeSeries',
        'stacked': false,
        region: event.ResourceProperties.Region,
        'title': 'RDS Queries (per second)'
      }
    });
  }
  let dashboard = {widgets: []};
  for (let w in widgets) {
    let widget = widgets[w];
    let x = (w % 2) * 12;
    let y = Math.floor(w/2);
    widget.x = x;
    widget.y = y;
    widget.width = 12;
    widget.height = 6;
    dashboard.widgets.push(widget);
  }
  console.log(`Generated dashboard: ${JSON.stringify(dashboard)}`);
  return dashboard;
}

exports.handler = async (event, context, cb) => {
  console.log(`Executing function with event: ${JSON.stringify(event)}`);
  try {  
    if (event.RequestType === 'Delete') {
      await cloudwatch.send(new DeleteDashboardsCommand({DashboardNames: [event.ResourceProperties.DashboardName]}));
      console.log(`Deleted dashboard ${event.ResourceProperties.DashboardName}.`);
      cfnCustomResourceSuccess(event, event.ResourceProperties.DashboardName);
    } else if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      await cloudwatch.send(new PutDashboardCommand({
        DashboardName: event.ResourceProperties.DashboardName,
        DashboardBody: JSON.stringify(generateDashboard(event))
      }));
      console.log(`Created/Updated dashboard ${event.ResourceProperties.DashboardName}.`);
      cfnCustomResourceSuccess(event, event.ResourceProperties.DashboardName);
    } else {
      error(new Error(`unsupported request type: ${event.RequestType}`));
    }
  } catch(e) {
      console.log('Error', e);
      cfnCustomResourceFailed(event, event.ResourceProperties.DashboardName, e);
  }
};
