var unity_doc_home_url = 'http://docs.unity3d.com/Documentation/ScriptReference/index.html';
var unity_query_url = 'http://docs.unity3d.com/Documentation/ScriptReference/30_search.html?q=';
var unity_class_reference_url = 'http://docs.unity3d.com/Documentation/ScriptReference/%class%.html';
var omnibox_description = '%class% - <dim>%type%</dim> - <url>%url%</url>';

var omnibox_empty = 'Visit Unity3D documentation';
var match_found_description = 'Go to <match>%class%</match> - <dim>%type%</dim> - <url>%url%</url>';
var match_not_found_description = 'Search Unity3D documentation for <match>%class%</match>';

var TYPE = '%type%';
var CLASS = '%class%';
var URL = '%url%';

var constants = {
  HTTP_TIMEOUT_MS: 10000,
  SCORE_THRESHOLD: 0.5,
  EMPTY_REGEX: /^\s*$/
}

var TYPES = {
  'classRuntime': 'Runtime Class',
  'enumRuntime': 'Runtime Enum',
  'attrRuntime': 'Runtime Attribute',
  'classEditor': 'Editor Class',
  'enumEditor': 'Editor Enum',
  'attrEditor': 'Editor Attribute',

  get: function(property) {
    if (this.hasOwnProperty(property))
      return this[property];
    return 'No type available.';
  }
};

var formatDefaultDescription = function(text, result) {
  var options = {
    class: result[0].content,
    type: result[0].type,
    url: formatClassUrl(result[0].content)
  }

  if (text.match(constants.EMPTY_REGEX)) {
    return omnibox_empty;
  }
  else if (options.class.toLowerCase() == text.toLowerCase()) {
    // we shift the first result to end since Chrome removes first result
    // if it contains the same content as the input text, however it does
    // so only if case matches - so we do it for chrome
    result.push(result.shift());
    return match_found_description.replace(CLASS, options.class)
      .replace(TYPE, options.type)
      .replace(URL, options.url);
  }

  // no direct matches
  return match_not_found_description.replace(CLASS, text);
}

// returns a friendly description to use in omnibox
var formatDescription = function(options) {
  return omnibox_description.replace(CLASS, options.class)
    .replace(TYPE, TYPES.get(options.type))
    .replace(URL, formatClassUrl(options.class));
}

// returns the full url to specified class
var formatClassUrl = function(className) {
  return unity_class_reference_url.replace(CLASS, className);
}

// our query url in case no results have been found
var formatQueryUrl = function(query) {
  return unity_query_url + query;
}

function navigate(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: url});
  });
}

// returns an array containing first `number` of items
Array.prototype.first = function(number) {
  var result = [];
  for (var i = 0; i < number; i++)
    result.push(this[i]);
  return result;
};

// swaps two items with given indices
Array.prototype.swap = function(left, right) {
  var temp = this[left];
  this[left] = this[right];
  this[right] = temp;
  return this;
};
