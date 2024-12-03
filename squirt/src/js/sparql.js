const ENDPOINT = 'http://localhost:3030/squirt/update';

export async function postToSparql(dataset) {
  const insertQuery = `
    INSERT DATA {
      ${dataset.toString()}
    }
  `;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update'
      },
      body: insertQuery
    });
    
    if (!response.ok) throw new Error('SPARQL update failed');
    return true;
  } catch (error) {
    console.error('SPARQL error:', error);
    throw error;
  }
}

export async function querySparql(query) {
  const response = await fetch(ENDPOINT.replace('/update', '/query'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/json'
    },
    body: query
  });
  return response.json();
}
