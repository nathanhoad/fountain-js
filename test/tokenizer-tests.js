var fs = require('fs'),
    should = require('should'),
    tokenizer = require('../src/tokenizer');

var script = fs.readFileSync(__dirname + '/the-riddling-troll.fountain', 'utf8');


describe('Tokenizer', function () {
  describe('#tokenize', function () {
    var output;
    
    beforeEach(function () {
      tokens = tokenizer.tokenize(script);
    });
    
    
    it('should find scenes', function () {
      tokens.should.containEql({ type: 'scene_heading', text: 'EXT. BRIDGE – DAY', scene_number: undefined });
    });
    
    
    it('should find transitions', function () {
      tokens.should.containEql({ type: 'transition', text: '> CUT TO:' });
    });
    
    
    it('should find characters', function () {
      tokens.should.containEql({ type: 'character', text: 'BARDUS' });
    });
    
    
    it('should find dialogue', function () {
      tokens.should.containEql({ type: 'dialogue_begin', dual: undefined });
      tokens.should.containEql({ type: 'character', text: 'BARDUS' });
      tokens.should.containEql({ type: 'dialogue', text: 'Hello there!' });
      tokens.should.containEql({ type: 'dialogue_end' });
      
      var script_fragment = "Some action is happening.\n\nBARDUS\nHello there!\n\n",
          tokens_in_fragment = tokenizer.tokenize(script_fragment);
      
      tokens_in_fragment[1].should.containEql({ type: 'dialogue_begin', dual: undefined });
      tokens_in_fragment[2].should.containEql({ type: 'character', text: 'BARDUS' });
      tokens_in_fragment[3].should.containEql({ type: 'dialogue', text: 'Hello there!' });
      tokens_in_fragment[4].should.containEql({ type: 'dialogue_end' });
    });
    
    
    it('should find actions', function () {
      tokens.should.containEql({ type: 'action', text: 'A STONE BRIDGE stands over a wide rushing river. In the distance a castle is sitting amidst rolling green hills. This is the kingdom of IMBUR.' });
    });
    
    
    it('should find lyrics', function () {
      var script_fragment = "Some action is happening.\n\n~The hills are alive!\n\nMore action is happening.",
          tokens_in_fragment = tokenizer.tokenize(script_fragment);
      
      tokens_in_fragment[1].should.containEql({ type: 'lyrics', text: '~The hills are alive!' });
    });
    
    it('should treat lines with only whitespace as empty', function () {
      var script_fragment = "CHARACTER NAME\nSome dialog.\n  \nAn action.",
          tokens_in_fragment = tokenizer.tokenize(script_fragment);
      
      tokens_in_fragment[0].should.containEql({ type: 'dialogue_begin' });
      tokens_in_fragment[1].should.containEql({ type: 'character', text: 'CHARACTER NAME' });
      tokens_in_fragment[2].should.containEql({ type: 'dialogue', text: 'Some dialog.'});
      tokens_in_fragment[3].should.containEql({ type: 'dialogue_end' });
      tokens_in_fragment[4].should.containEql({ type: 'action', text: 'An action.' });
    });
  });
});