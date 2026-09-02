function PPG_REPO_memory_(seed) {
  var tables = seed || {};
  function rows(n){ if(!tables[n]) tables[n]=[]; return tables[n]; }
  function copyRows(n) {
    var source = rows(n), copy = Array();
    source.forEach(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});copy.push(y);});
    return copy;
  }
  return {
    tables: tables,
    read: function(n){ return copyRows(n); },
    readTable: function(n){
      if(!Object.prototype.hasOwnProperty.call(tables,n)){
        var e=new Error('SHEET_NOT_FOUND:'+n);e.code='SHEET_NOT_FOUND';throw e;
      }
      return {headers:null,rows:copyRows(n)};
    },
    append: function(n, values){ var a=rows(n); (values||[]).forEach(function(v){a.push(v);}); return (values||[]).length; },
    find: function(n,p){var source=copyRows(n),out=Array();source.forEach(function(r){if(Object.keys(p||{}).every(function(k){return r[k]===p[k];}))out.push(r);});return out;},
    update: function(n,p,changes){rows(n).forEach(function(r){if(Object.keys(p||{}).every(function(k){return r[k]===p[k];}))Object.keys(changes||{}).forEach(function(k){r[k]=changes[k];});});}
  };
}
function PPG_REPO_fromSpreadsheet_(ss) {
  function table(n) {
    var sh=ss.getSheetByName(n);
    if(!sh){var e=new Error('SHEET_NOT_FOUND:'+n);e.code='SHEET_NOT_FOUND';throw e;}
    var lr=sh.getLastRow(),lc=sh.getLastColumn();
    if(lr<1||lc<1){var emptyError=new Error('HEADER_MISMATCH:'+n);emptyError.code='HEADER_MISMATCH';throw emptyError;}
    var h=sh.getRange(1,1,1,lc).getValues()[0], values=lr<2?[]:sh.getRange(2,1,lr-1,lc).getValues(), result=Array();
    values.forEach(function(a){var o={};h.forEach(function(k,i){o[k]=a[i];});result.push(o);});
    return {headers:h,rows:result};
  }
  return {
    readTable: table,
    read: function(n){try{return table(n).rows;}catch(error){if(error&&error.code==='SHEET_NOT_FOUND')return [];throw error;}},
    append: function(n, values){var sh=ss.getSheetByName(n);if(!sh)throw new Error('SHEET_NOT_FOUND:'+n);var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];(values||[]).forEach(function(v){if(!PPG_SCHEMA_headersMatch_(h,Object.keys(v)))throw new Error('HEADER_MISMATCH:'+n);});if(values&&values.length)sh.getRange(sh.getLastRow()+1,1,values.length,h.length).setValues(values.map(function(v){return h.map(function(k){return v[k]===undefined?'':v[k];});}));return values.length;},
    find:function(n,p){return this.read(n).filter(function(r){return Object.keys(p||{}).every(function(k){return r[k]===p[k];});});},
    update:function(n,p,c){var sh=ss.getSheetByName(n),a=this.read(n),h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],expected=PPG_SCHEMA_manifest_()[n];if(expected&&!PPG_SCHEMA_headersMatch_(expected,h))throw new Error('HEADER_MISMATCH:'+n);a.forEach(function(r){if(Object.keys(p||{}).every(function(k){return r[k]===p[k];}))Object.keys(c||{}).forEach(function(k){r[k]=c[k];});});if(a.length)sh.getRange(2,1,a.length,h.length).setValues(a.map(function(r){return h.map(function(k){return r[k]===undefined?'':r[k];});}));}
  };
}
