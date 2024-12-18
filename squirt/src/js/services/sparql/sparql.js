const ENDPOINT = 'http://localhost:3030/squirt/update';

export async function postToSparql(dataset) {
  if (!dataset) {
    throw new Error('Dataset is required');
  }

  const insertQuery = `
    INSERT DATA {
      ${dataset.toString()}
    }
  `;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update',
        'Accept': '*/*',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      mode: 'cors',
      credentials: 'include',
      body: insertQuery
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SPARQL update failed: ${response.status} ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error('SPARQL error:', error);
    throw error;
  }
}

export async function querySparql(query) {
  if (!query) {
    throw new Error('Query is required');
  }

  try {
    const response = await fetch(ENDPOINT.replace('/update', '/query'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/json',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      mode: 'cors',
      credentials: 'include',
      body: query
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SPARQL query failed: ${response.status} ${errorText}\n${query}`);
    }

    return response.json();
  } catch (error) {
    console.error('SPARQL query error:', error);
    throw error;
  }
}
