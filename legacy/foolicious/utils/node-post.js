var request = require('request');
var querystring = require('querystring');

var myquery2 = querystring.stringify({update: "PREFIX test:<http://www.semanticweb.org/muhammad/ontologies/2017/2/untitled-ontology-14#> INSERT { ?KPI_Variables test:hasValue_ROB1 2000} WHERE { ?KPI_Variables test:hasValue_ROB1 ?Newvalue FILTER(?KPI_Variables= test:Actual_Production_Time)}"});

request.post({headers: {'content-type' : 'application/x-www-form-urlencoded'},url:'http://localhost:3030/DS-1/?'+myquery2 }, function (error, response, body) {
  if (!error && response.statusCode == 200) {
   // Show the HTML for the Google homepage.
console.log('successful update');
console.log(body);
  }
  else
  {
   console.log(response.statusCode)
   console.warn(error);
  }
});
