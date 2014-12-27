var sections = require('./sections'),
    tokenizer = require('./tokenizer'),
    events = require('events');


var parser = {
  parse: function (script, _options, callback) {
    if (callback === undefined && typeof _options === 'function') {
      callback = _options;
      _options = {};
    } else if (_options === undefined) {
      _options = {};
    }
    
    var eventEmitter = new events.EventEmitter();

    // Default options
    var options = {
      tokens: _options['tokens'] || false,
      events: _options['events'] || false
    };
      
    var doParse = function () {
      var tokens = tokenizer.tokenize(script), 
          token,
          title_page_html = [], 
          script_html = [];
      
      var output = { 
        title: '',
        credit: '',
        authors: [],
        source: '',
        notes: '',
        draft_date: '',
        date: '',
        contact: '',
        copyright: '',
        
        scenes: [],
        
        title_page_html: '',
        script_html: ''
      };

      for (var j in tokens) {
        token = tokens[j];
        token.text = parser.lexer(token.text);

        switch (token.type) {
          case 'title': 
            title_page_html.push('<h1>' + token.text + '</h1>'); 
            output.title = token.text.replace('<br />', ' ').replace(/<(?:.|\n)*?>/g, ''); 
            break;
          case 'credit': 
            title_page_html.push('<p class="credit">' + token.text + '</p>'); 
            output.credit = token.text;
            break;
          case 'author': 
            title_page_html.push('<p class="authors">' + token.text + '</p>');
            output.authors.push(token.text)
            break;
          case 'authors': 
            title_page_html.push('<p class="authors">' + token.text + '</p>'); 
            output.authors = output.authors.concat(token.text.replace('<br />', "\n").replace(', ', ',').split(/[\n,]/));
            break;
          case 'source': 
            title_page_html.push('<p class="source">' + token.text + '</p>'); 
            output.source = (token.text);
            break;
          case 'notes': 
            title_page_html.push('<p class="notes">' + token.text + '</p>'); 
            output.notes = token.text;
            break;
          case 'draft_date': 
            title_page_html.push('<p class="draft-date">' + token.text + '</p>'); 
            output.draft_date = token.text;
            break;
          case 'date': 
            title_page_html.push('<p class="date">' + token.text + '</p>'); 
            output.date = token.text;
            break;
          case 'contact': 
            title_page_html.push('<p class="contact">' + token.text + '</p>'); 
            output.contact = token.text;
            break;
          case 'copyright': 
            title_page_html.push('<p class="copyright">' + token.text + '</p>'); 
            output.copyright = token.text;
            break;

          case 'scene_heading': 
            script_html.push('<h2' + (token.scene_number ? ' id=\"' + token.scene_number + '\">' : '>') + token.text + '</h2>'); 
            output.scenes.push(token.text);
            break;
          case 'transition': 
            script_html.push('<p class="transition">' + token.text + '</p>');
            break;

          case 'dual_dialogue_begin': 
            script_html.push('<div class="dual-dialogue">'); 
            break;
          case 'dialogue_begin': 
            script_html.push('<div class="dialogue' + (token.dual ? ' ' + token.dual : '') + '">'); 
            break;
          case 'character': 
            script_html.push('<h4>' + token.text.replace(/^@/, '') + '</h4>'); 
            break;
          case 'parenthetical': 
            script_html.push('<p class="parenthetical">' + token.text + '</p>'); 
            break;
          case 'dialogue': 
            script_html.push('<p>' + token.text + '</p>'); 
            break;
          case 'dialogue_end': 
            script_html.push('</div>'); 
            break;
          case 'dual_dialogue_end': 
            script_html.push('</div>'); 
            break;

          case 'section': 
            script_html.push('<p class="section" data-depth="' + token.depth + '">' + token.text + '</p>'); 
            break;
          case 'synopsis': 
            script_html.push('<p class="synopsis">' + token.text + '</p>'); 
            break;

          case 'note': 
            script_html.push('<!-- ' + token.text + ' -->'); 
            break;
          case 'boneyard_begin':
            script_html.push('<!-- ');
            break;
          case 'boneyard_end': 
            script_html.push(' -->'); 
            break;
          
          case 'lyrics':
            script_html.push('<p class="lyrics">' + token.text + '</p>');
            break;
          case 'action': 
            script_html.push('<p>' + token.text + '</p>'); 
            break;
          case 'centered': 
            script_html.push('<p class="centered">' + token.text + '</p>'); 
            break;
          
          case 'page_break': 
            script_html.push('<hr />'); 
            break;
          case 'line_break': 
            script_html.push('<br />'); 
            break;
        }      
        
        eventEmitter.emit(token.type, token.text);
      }
      eventEmitter.emit('end');
      
      output.title_page_html = title_page_html.join('');
      output.script_html = script_html.join('');
      
      if (options.tokens) {
        output.tokens = tokens;
      };
      
      return output;
    };
    
    if (typeof callback === 'function') {
      return callback(doParse());
    } else if (options.events) {
      process.nextTick(doParse);
      return eventEmitter;
    } else {
      return doParse();
    }
  },
  
  
  


  lexer: function (s) {
    if (!s) {
      return;
    }  
    
    var inline = {
      note: '<!-- $1 -->',
      line_break: '<br />',
      bold_italic_underline: '<strong><em><span style="text-decoration:underline">$2</span></em></strong>',
      bold_underline: '<strong><span style="text-decoration:underline">$2</span></strong>',
      italic_underline: '<em><span style="text-decoration:underline">$1</span></em>',
      bold_italic: '<strong><em>$2</em></strong>',
      bold: '<strong>$2</strong>',
      italic: '<em>$2</em>',
      underline: '<span style="text-decoration:underline">$2</span>'
    };

    var styles = ['bold_italic_underline', 'bold_underline', 'italic_underline', 'bold_italic', 'bold', 'italic', 'underline'],
        style, 
        match;

    s = s.replace(sections.note_inline, inline.note).replace(/\\\*/g, '[star]').replace(/\\_/g, '[underline]').replace(/\n/g, inline.line_break);

    for (var i in styles) {
      style = styles[i];
      match = sections[style];
 
      if (match.test(s)) {
        s = s.replace(match, inline[style]);
      }
    }

    return s.replace(/\[star\]/g, '*').replace(/\[underline\]/g, '_').trim();
  }
  
};


module.exports = parser;