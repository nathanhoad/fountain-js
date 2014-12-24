var sections = require('./sections');


var tokenizer = {
  
  clean: function (script) {
    var s = script.replace(sections.boneyard, '\n$1\n').replace(sections.standardizer, '\n').replace(sections.cleaner, '').replace(sections.whitespacer, '');
    s = s.replace(/^\s+$/gm, '');
    return s;
  },


  tokenize: function (script) {
    var script_lines = tokenizer.clean(script).split(sections.splitter),
        line, 
        match, 
        parts, 
        text, 
        meta, 
        i,
        x, 
        length, 
        dual, 
        tokens = [];

    for (i in script_lines) {
      line = script_lines[i];
      
      // title page
      if (sections.title_page.test(line)) {
        match = line.replace(sections.title_page, '\n$1').split(sections.splitter);
        for (x = 0, length = match.length; x < length; x++) {
          parts = match[x].replace(sections.cleaner, '').split(/\:\n*/);
          tokens.push({ type: parts[0].trim().toLowerCase().replace(' ', '_'), text: parts[1].trim() });
        }
        continue;
      }

      // scene headings
      if (match = line.match(sections.scene_heading)) {
        text = match[1] || match[2];

        if (text.indexOf('  ') !== text.length - 2) {
          if (meta = text.match(sections.scene_number)) {
            meta = meta[2];
            text = text.replace(sections.scene_number, '');
          }
          tokens.push({ type: 'scene_heading', text: text, scene_number: meta || undefined });
        }
        continue;
      }

      // centered
      if (match = line.match(sections.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }

      // transitions
      if (match = line.match(sections.transition)) {
        tokens.push({ type: 'transition', text: match[1] || match[2] });
        continue;
      }
    
      // dialogue blocks - characters, parentheticals and dialogue
      if (match = line.match(sections.dialogue)) {
        if (match[1].indexOf('  ') !== match[1].length - 2) {
          parts = match[3].split(/(\(.+\))(?:\n+)/).reverse();

          dual_diaglogue = !!match[2];

          if (dual_diaglogue) {
            tokens.push({ type: 'dual_dialogue_begin' });
          }

          tokens.push({ type: 'dialogue_begin', dual: dual_diaglogue ? 'right' : dual ? 'left' : undefined });
          tokens.push({ type: 'character', text: match[1].trim() });
  
          for (x = 0, length = parts.length; x < length; x++) {	
            text = parts[x].trim();

            if (text.length > 0) {
              tokens.push({ type: sections.parenthetical.test(text) ? 'parenthetical' : 'dialogue', text: text });
            }
          }
          
          tokens.push({ type: 'dialogue_end' });
          
          if (dual_diaglogue) {
            tokens.push({ type: 'dual_dialogue_end' });
          }
          continue;
        }
      }
      
      // section
      if (match = line.match(sections.section)) {
        tokens.push({ type: 'section', text: match[2], depth: match[1].length });
        continue;
      }
      
      // synopsis
      if (match = line.match(sections.synopsis)) {
        tokens.push({ type: 'synopsis', text: match[1] });
        continue;
      }

      // notes
      if (match = line.match(sections.note)) {
        tokens.push({ type: 'note', text: match[1]});
        continue;
      }      

      // boneyard
      if (match = line.match(sections.boneyard)) {
        tokens.push({ type: match[0][0] === '/' ? 'boneyard_begin' : 'boneyard_end' });
        continue;
      }      

      // page breaks
      if (sections.page_break.test(line)) {
        tokens.push({ type: 'page_break' });
        continue;
      }
      
      // line breaks
      if (sections.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
      }
      
      // lyrics
      if (sections.lyrics.test(line)) {
        tokens.push({ type: 'lyrics', text: line });
        continue;
      }

      tokens.push({ type: 'action', text: line });
    }

    return tokens;
  }
  
};

module.exports = tokenizer;