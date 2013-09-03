var items = [];
var htmlparser = Tautologistics.NodeHtmlParser;

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  // sort items by score with 'text'
  items.sort(function compare(left, right) {
    return right.content.score(text, constants.SCORE_THRESHOLD) - left.content.score(text, constants.SCORE_THRESHOLD);
  });

  var result = items.first(10);
  var defaultSuggestion = formatDefaultDescription(text, result);

  // chrome expects an item with only content and description, so we have to
  // create dummy objects
  itemsToSuggest = [];
  result.forEach(function(item) {
    itemsToSuggest.push({
      content: item.content,
      description: item.description
    });
  });

  suggest(itemsToSuggest);

  chrome.omnibox.setDefaultSuggestion({
    description: defaultSuggestion
  });
});

chrome.omnibox.onInputEntered.addListener(function(text) {
  if (text.match(constants.EMPTY_REGEX)) {
    navigate(unity_doc_home_url);
    return;
  }

  var url = formatQueryUrl(text);
  for (var i in items) {
    if (!items.hasOwnProperty(i))
      continue;

    // see if there's a match so we can jump to class reference directly
    var entry = items[i];
    if (entry.content.toLowerCase() == text.toLowerCase()) {
      url = formatClassUrl(entry.content);
      break;
    }
  }
  
  navigate(url);
});

unityDoc = {
  restart: function() {
    setTimeout(this.initialize, constants.HTTP_TIMEOUT_MS);
  },
  initialize: function () {
    $.get(unity_doc_home_url)
    .done(this.parseHtml.bind(this, this.parseClassReferences))
    .fail(this.restart);
  },
  parseHtml: function(callback, html) {
    var self = this;
    var handler = new htmlparser.HtmlBuilder(function (error, dom) {
      if (error)
        unityDoc.restart();
      else
        callback(dom);
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
  },
  parseClassReferences: function(document) {
    var menu = htmlparser.DomUtils.getElements({ class: 'left-menu' }, document, true, 1);
    var list = htmlparser.DomUtils.getElements({ tag_name: 'li' }, document, true);

    list.forEach(function(element) {
      if (element == null || element.attributes == null)
        return;
      if (!TYPES.hasOwnProperty(element.attributes.class))
        return;

      var type = element.attributes.class;
      var link = htmlparser.DomUtils.getElements({ tag_name: 'a' }, element, true, 1);
      // we're getting an array with only 1 element so we simplify
      link = link[0];

      var text = link.children[0].data;
      items.push({
        content: text,
        description: formatDescription({
          class: text,
          type: type
        }),
        type: TYPES.get(type)
      });
    });
  }
}

unityDoc.initialize();
