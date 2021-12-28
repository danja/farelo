var linkHT = function (url) {
  return `<li><a href='${url}'>${url}</a></li>`
}

var instanceNodeHT = function (url) {
  return `<li class="instance-item url">${url}</li>`
}

// need to deal with <> with prefixes
var property_object_uriHT = function (subject, property, object) {
  return `<span class="triple">
              <span class="url">&lt;${subject}&gt; </span>
              <span class="url">&lt;${property}&gt; </span>
              <span class="url">&lt;${object}&gt; .</span>
          </span>`
}

var property_object_literalHT = function (subject, property, object) {
  return `<span class="triple">
              <span class="url">&lt;${subject}&gt; </span>
              <span class="url">&lt;${property}&gt; </span>
              <span class="literal">"${object}" .</span>
          </span>`
}
