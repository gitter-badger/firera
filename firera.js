var Firera = function(context, custom_drivers){
    var scope = context || false;
    var vars = [];
    var drivers = {
	cell: {
	    
	},
	visibility: {
	    setter: function(val, selector, context){
		if(val){
		    $(selector, context).show();
		} else {
		    $(selector, context).hide();
		}
	    }
	},
	val: {
	    selfRefresh: true,
	    setter: function(val, selector, context){
		$(selector, context).val(val);
	    },
	    getter: function(selector, context){
		console.log('getter is called ' + selector + ' ' + context + ": " + $(selector, context).val());
		return $(selector, context).val();
	    },
	    startObserving: function(selector, context){
		var self = this;
		$(selector, context).bind("keyup, change", function(val){
		    self.val = val;		    
		    self.compute();
		})
	    }
	},
	html: {
	    setter: function(val, selector, context){
		$(selector, context).html(val);
	    }
	}
    }
    if(custom_drivers && (custom_drivers instanceof Object)){
	for(var i in custom_drivers){
	    drivers[i] = custom_drivers[i];
	}
    }
    
    var error = function(str){
	console.log("EROOR: " + str);
    }
    
    var Cell = function(selector){
	this.selector = selector;
	vars[selector] = this;
	if(selector.indexOf("|") !== -1){
	    // this is a dom selector
	    var parts = selector.split("|");
	    this.jquerySelector = parts[0];
	    if(!$(this.jquerySelector, scope).length){
		error('Selected element "' + this.jquerySelector + '" not found in scope(' + scope + ')');
	    }
	    if(!drivers[parts[1]]){
		error('Unknown html driver: ' + parts[1]);
	    } else {
		this.type = parts[1];
	    }
	    if(drivers[this.type].selfRefresh){
		this.compute = function(){
		    this.val = drivers[this.type].getter.call(this, this.jquerySelector, scope);
		    this.updateObservers();
		}
		drivers[this.type].startObserving.call(this, this.jquerySelector, scope);
		this.compute();
	    }
	} else { // this is just custom abstract varname
	    this.type = 'cell';
	}
	this.observers = [];
	this.driver = drivers[this.type];
    }
    
    Cell.prototype.addObserver = function(cell){
	this.observers.push(cell);
    }
    
    Cell.prototype.get = function(){
	return this.val;
    }
    
    Cell.prototype.set = function(val){
	this.val = val;
	if(this.driver.setter){
	    this.driver.setter.call(this, val, this.jquerySelector, scope);
	}
	this.updateObservers();
	return this;
    }
    
    Cell.prototype.updateObservers = function(){
	if(this.observers){
	    for(var i=0; i<this.observers.length;i++){
		this.observers[i].compute();
	    }
	} 
    }
    
    Cell.prototype.as = function(cell){
	this.is.call(this, function(flag){ return !!flag;}, cell);
    }
    Cell.prototype.notAs = function(cell){
	this.is.call(this, function(flag){ return !flag;}, cell);
    }
    
    Cell.prototype.is = function(formula){
	var args = Array.prototype.slice.call(arguments, 1);
	if(args.length){
	    for(var i= 0;i<args.length;i++){
		if(!(args[i] instanceof Cell)){
		    if(vars[args[i]]){
			args[i] = vars[args[i]];
		    } else {
			args[i] = new Cell(args[i]);
		    }
		}
		args[i].addObserver(this);
	    }
	    this.formula = formula;
	} else {
	    this.val = formula;
	}
	this.compute = function(){
	    var args1 = [];
	    for(var i=0; i<args.length;i++){
		args1.push(args[i].get());
	    }
	    this.val = formula.apply(this, args1);
	    if(this.driver.setter){
		this.driver.setter.call(this, this.val, this.jquerySelector, scope);
	    }
	    this.updateObservers();
	}
	if(args.length) this.compute();
	return this;
    }
    
    return function(selector){
	if(selector instanceof Object){
	    for(var i in selector){
		var cell = vars[i] ? vars[i] : new Cell(i);
		if(selector[i] instanceof Array){
		    if(selector[i][0] instanceof Function){
			cell['is'].apply(cell, selector[i]);
		    } else {
			cell[selector[i][0]].apply(cell, selector[i].slice(1));
		    }
		} else {
		    cell.is(selector[i]);
		}
	    }
	    return true;
	}
	return vars[selector] || new Cell(selector);
    }
}
