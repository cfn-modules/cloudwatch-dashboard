const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({apiVersion: '2010-08-01'});
const response = require('cfn-response');


function generateDashboard(event) {
  let widgets = [];
  if (event.ResourceProperties.AlbFullName) {
    widgets.push({
      type: 'metric',
      properties: {
        metrics: [
          [{expression: '(5lb+5tg)/r*100', label: '5XX', id: '5r'}],
          [{expression: '(4lb+4tg)/r*100', label: '4XX', id: '4r'}],
          ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', event.ResourceProperties.AlbFullName, {stat: 'Sum', id: 'r', visible: false}],
          ['.', 'HTTPCode_ELB_5XX_Count', '.', '.', {stat: 'Sum', id: '5lb', visible: false}],
          ['.', 'HTTPCode_ELB_4XX_Count', '.', '.', {stat: 'Sum', id: '4lb', visible: false}],
          ['.', 'HTTPCode_Target_5XX_Count', '.', '.', {stat: 'Sum', id: '5tg', visible: false}],
          ['.', 'HTTPCode_Target_4XX_Count', '.', '.', {stat: 'Sum', id: '4tg', visible: false}]
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

exports.handler = (event, context, cb) => {
  console.log(`Executing function with event: ${JSON.stringify(event)}`);
  const error = (err) => {
    console.log('Error', err);
    response.send(event, context, response.FAILED);
  };
  if (event.RequestType === 'Delete') {
    cloudwatch.deleteDashboards({DashboardNames: [event.ResourceProperties.DashboardName]}, function(err) {
      if (err) {
        error(err);
      } else {
        response.send(event, context, response.SUCCESS, {}, event.ResourceProperties.DashboardName);
      }
    });
  } else if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    cloudwatch.putDashboard({
      DashboardName: event.ResourceProperties.DashboardName,
      DashboardBody: JSON.stringify(generateDashboard(event))
    }, function(err) {
      if (err) {
        error(err);
      } else {
        console.log(`Created/Updated dashboard ${event.ResourceProperties.DashboardName}.`);
        response.send(event, context, response.SUCCESS, {}, event.ResourceProperties.DashboardName);
      }
    });
  } else {
    error(new Error(`unsupported request type: ${event.RequestType}`));
  }
};
