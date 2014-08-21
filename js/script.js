function log(s) {
	if (console) console.log(s);
}
function tr(s) {
	return $.trim(s.replace(/\t+/, ' '));
}

var demoCSS;
$(document).ready(function() {
	$('.convert').click(parseInput);
	$('#input').keyup(parseInput);
	$('label.radio').click(parseInput);

	var demoURL='css/_demo.css';
	//demoURL='../../theme/css/mo.css';
	//demoURL='css/style.css';
	$.get(demoURL, function(val) {
		demoCSS=val;
		$('.btn.demo').click(function() {
			$('#input').val(demoCSS);
		});
	});

	$('.select').click(function() {
		$('#output').select();
	});
});

var indentS;
var openingBracket;
var closingBracket;
var semiColumn;
var eol;
function parseInput() {
	var langVal=$('input:radio[name=lang]:checked').val();
	if (langVal=='less') {
		eol=';';
		openingBracket='{';
		closingBracket='}';
		semiColumn=':';
	} else if (langVal=='sass') {
		eol=';';
		openingBracket='{';
		closingBracket='}';
		semiColumn=':';
	} else if (langVal=='stylus') {
		eol='';
		openingBracket='';
		closingBracket='';
		semiColumn='';
	}

	var indentVal=$('input:radio[name=indent]:checked').val();
	if (indentVal=='indentt') indentS='\t';
	else if (indentVal=='indent2') indentS='  ';
	else if (indentVal=='indent4') indentS='    ';

	$('#output').val(parseCSS($('#input').val()));
}
function parseCSS(s) {
	var least={children:{}};

	// Remove comments
	s=s.replace(/\/\*[\s\S]*?\*\//gm, '');

	s.replace(/([^{]+)\{([^}]+)\}/g, function(group, selector, declarations) {
		var o={};
		o.source=group;
		o.selector=tr(selector);

		var path=least;

		if (o.selector.indexOf(',')>-1) {
			// Comma: grouped selector, we skip
			var sel=o.selector;
			if (!path.children[sel]) {
				path.children[sel]={children:{}, declarations:[]};
			}
			path = path.children[sel];
		} else {
			// No comma: we process

			// Fix to prevent special chars to break into parts
			o.selector=o.selector.replace(/\s*([>\+~])\s*/g, ' &$1');
			o.selector=o.selector.replace(/(\w)([:\.])/g, '$1 &$2');

			o.selectorParts=o.selector.split(/[\s]+/);
			for (var i=0; i<o.selectorParts.length; i++) {
				var sel=o.selectorParts[i];
				// We glue the special chars fix
				sel=sel.replace(/&(.)/g, '& $1 ');
				sel=sel.replace(/& ([:\.]) /g, '&$1');

				if (!path.children[sel]) {
					path.children[sel]={children:{}, declarations:[]};
				}
				path = path.children[sel];
			}
		}

		declarations.replace(/([^:;]+):([^;]+)/g, function(decl, prop, val) {
			var declaration={
				source:decl,
				property:tr(prop),
				value:tr(val)
			};
			path.declarations.push(declaration);
		});
	});
	return exportObject(least);
}
var depth=0;
var s='';
function exportObject(path) {
	var s='';
	$.each(path.children, function(key, val) {
		s+=getIndent()+key+' '+openingBracket+'\n';
		depth++;
		for (var i=0; i<val.declarations.length; i++) {
			var decl=val.declarations[i];
			s+=getIndent()+decl.property+semiColumn+' '+decl.value+eol+'\n';
		}
		s+=exportObject(val);
		depth--;
		s+=getIndent()+closingBracket+'\n';
	});

	// Remove blank lines - http://stackoverflow.com/a/4123442
	s=s.replace(/^\s*$[\n\r]{1,}/gm, '');

	return s;
}
function getIndent() {
	var s='';
	for (var i=0; i<depth; i++) {
		s+=indentS;
	}
	return s;
}