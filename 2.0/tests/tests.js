var id = a => a;
var always = (a) => {
	return () => a;
}

describe('Plain base', function () {
    /*it('Testing simple values conversion', function () {
        var pb = {
            'a': 10,
            'b': 32,
            'c': ['+', 'a', 'b']
        }
        var pbs = Firera.func_test_export.parse_pb(pb).plain_base;
        assert.deepEqual(pbs.$init, {
            a: 10,
            b: 32,
        });
        assert.equal(pbs.c[1](1, 2), 3);
    });*/
    it('Testing simple grid', function () {
        var app = Firera({
            __root: {
                $init: {
                    a: 10,
                    b: 32
                },
                'c': ['+', 'a', 'b']
            },
            'todo': {},
        });
        assert.equal(app.get('c'), 42);
        app.set('a', 20);
        assert.equal(app.get('c'), 52);
    });
    it('Testing nested fexpr', function () {
        var app = Firera({
            __root: {
                $init: {
                    'a': 10,
                    'b': 20,
                    'c': 12,
                },
                'd': ['+', ['-', 'b', 'c'], 'a']
            },
            'todo': {},
        });
        assert.equal(app.get('d'), 18);
        app.set('a', 20);
        assert.equal(app.get('d'), 28);
    });
    it('Testing async', function () {
        var handler = function(e, cb){
            cb($(this).val());
        }
        var app = Firera({
            __root: {
                '$init': {
                    '$el': $(".dummy")
                },
                'inp': ['async', function (done, [$prev_el, $now_el]) {
                        //console.log('ATTACHING HANDLERS', $now_el);
                        if($prev_el){
                            $prev_el.unbind('keyup');
                        }
                        $now_el.bind('keyup', function(){
                            done($(this).val());
                            console.log('KEYUP', app);
                        });
                    }, '^$el']
            }
        });
        //console.log('SETTING VALUES FROM DOM');
        app.set('$el', $(".async-ex input"));
        //console.log(app.root);
    });
    it('Testing passive listening', function () {
        var app = Firera({
            __root: {
                $init: {
                    'a': 10,
                    'b': 32,
                },
                'c': ['+', 'a', '-b']
            }
        });
        assert.equal(app.get('c'), 42);
        app.set('a', 20);
        assert.equal(app.get('c'), 52);
        app.set('b', 42);
        assert.equal(app.get('c'), 52);
        app.set('a', 30);
        assert.equal(app.get('c'), 72);
    });
    it('Testing map dependency', function () {
        var app = Firera({
            __root: {
                $init: {
                    'a': 10,
                    'b': 32,
                },
                'c': {
                    a: function(z){ return z + 1;}, 
                    b: function(z){ return z*(-1);
                }}
            }
        });
        app.set('a', 20);
        assert.equal(app.get('c'), 21);
        app.set('b', 42);
        assert.equal(app.get('c'), -42);
    });
    it('Testing FUNNEL dependency', function () {
        var app = Firera({
            __root: {
                $init: {
                    'a': 10,
                    'b': 32,
                },
                'c': ['funnel', function(cellname, val){
                    //console.log('got FUNNEL', arguments); 
                    return cellname + '_' + val;
                }, 'a', 'b']
            }
        });
        app.set('a', 20);
        assert.equal(app.get('c'), 'a_20');
        app.set('b', 42);
        assert.equal(app.get('c'), 'b_42');
    });
    it('Testing basic html functionality', function () {
        var app = Firera({
            __root: {
                $init: {
                    $el: $(".test-html")
                },
                'someval': [id, 'input|getval'],
                '.blinker|visibility': [(a) => (a && a.length%2), 'someval']
            }
        });
        $('.test-html input').val('ololo').keyup();
        assert.equal(app.get('someval'), 'ololo');
    });
    it('Testing nested hashes', function () {
        var str = false;
        var app = Firera({
            __root: {
                $init: {
                    $el: $(".test-nested")
                },
                someval: [id, 'todo/completed'],
                $children: {
                    todo: 'item',
                },
            },
            'item': {
				$init: {
					completed: str,
				},
            	completed: {
            		'.done|click': true,
            	}
            }
        });
        //$('.test-html input').val('ololo').keyup();
        assert.equal(app.get('someval'), str);
        app.set('completed', true, 'todo');
        assert.equal(app.get('someval'), true);
    });
    it('Testing multiple children', function () {
        var str = false;
        var app = Firera({
            __root: {
                $init: {
                    $el: $(".test-nested")
                },
                completed_counter: ['closure', function(){
                        var c = 0;
                        return function(arr){
							if(!arr) return;
                            var key = arr[0];
                            var prev_val = arr[1][0];
                            var val = arr[1][1];
                            if(prev_val === undefined) return c;
                            if(val) {
                                c++;
                            } else { 
                                c--; 
                            }
                            return c;
                        }
                }, '*/changes'],
                $children: {
                    1: 'item',
                    2: 'item',
                    3: 'item',
                },
            },
            'item': {
				$init: {
					completed: str,
				},
            	completed: {
            		'.done|click': true,
            	},
                'changes': '^completed',
            }
        });
        app.set('completed', true, '2');
        assert.equal(app.get('completed_counter'), 1);
        app.set('completed', true, '1');
        app.set('completed', true, '3');
        app.set('completed', false, '2');
        assert.equal(app.get('completed_counter'), 2);
        //console.log('Now completed', app.get('completed_counter'));
    });
    it('Testing nested cells', function () {
        var app = Firera({
            __root: {
                $init: {
                    a: 42
                },
                'foo': ['nested', function(cb, a){
                        if(a % 2){
                            cb('odd', a);
                        } else {
                            cb('even', a);
                        }
                }, ['odd', 'even'], 'a'],
            }
        });
        assert.equal(app.get('foo.even'), 42);
        assert.equal(app.get('foo.odd'), null);
        
        app.set('a', 13);
        assert.equal(app.get('foo.even'), 42);
        assert.equal(app.get('foo.odd'), 13);
    });
    var add = (a, b) => a + b;
    it('Testing curcular dependency', function () {
        var app = Firera({
            __root: {
                $init: {
                    d: 42,
                },
                a: [add.bind(null, 10), 'b'],
                b: [add.bind(null, 20), 'c'],
                c: ['+', 'a', 'd'],
            }
        });
    });
    
    var get_by_selector = function(name, $el){
        //console.info("GBS", arguments);
        return $el ? $el.find('[data-fr=' + name + ']') : null;
    }
    
    it('Testing HTML package', function () {
        var app = Firera({
            __root: {
                $init: {
                    a: 42,
                },
                b: [add.bind(null, 20), 'a'],
                $children: {
                    item: 'person'
                }
            },
            person: {
                $init: {
                    name: 'John',
                    surname: 'Kovalenko',
                },
                '$el': [get_by_selector, '$name', '../$el'],
                'dummy': [id, '$writer'],
                'dummy2': [id, '$writer'],
                'dummy3': [id, 'dummy']
            }
        });
        // if $el in root is empty, it's <body> by default
        assert.equal(app.get('$el').get()[0], $('body').get()[0]);
        assert.equal(
            app.get('$el', 'item').get()[0], 
            $('div[data-fr=item]').get()[0]
        );

        app.set('name', 'Mykola', 'item');
    });

    it('Testing dynamic $children members', function () {
        var app = Firera({
        	__root: {
        		$init: {
        			registered: false,
        		},
	        	val: [id, 'block/foo'],
	        	$children: {
	        		block: [always(
	        			[{
	        				$init: {
	        					foo: 'bar'
	        				}
	        			}, {
	        				
	        			}]
	        		), 'registered'],
	        	}
        	},
        })
        assert.equal(app.get('val'), 'bar');
        app.set('registered', true);
    });
    it('Testing hash linking', function () {
        var app = Firera({
        	__root: {
        		$init: {
        			registered: false,
        			val: null,
        		},
	        	$children: {
	        		block: [always(
	        			[{
	        				$init: {
	        					foo: 'bar',
	        					boo: null
	        				}
	        			}, {
	        				'val': 'foo'
	        			},
	        			{
	        				'boo': 'registered'
	        			}]
	        		), 'registered'],
	        	}
        	},
        })
        assert.equal(app.get('val'), 'bar');
        assert.equal(app.get('boo', 'block'), false);
        app.set('registered', true);
        assert.equal(app.get('boo', 'block'), true);
    });
    it('Testing deltas, arrays', function () {
        var app = Firera({
        	__root: {
        		$init: {
	        		show: 'all',
					numbers: [1, 2, 3]
	        	},
                arr_changes: ['arr_deltas', 'numbers'],
	        	$children: {
					items: ['list', 'item', {$deltas: '../arr_changes'}],
				}
        	},
        	'item': {
				completed: {
					__def: false,
					'.done|click': true
				}
        	}
        })
        app.set('numbers', [1, 2, 5, 5]);
        
        var deltas = app.get('arr_changes');
        assert.deepEqual(deltas, [["add","3",5],["change","2",5]]);
        app.set('numbers', []);
        
        deltas = app.get('arr_changes');
        assert.deepEqual(deltas, [["remove","0"],["remove","1"],["remove","2"],["remove","3"]]);
        app.set('numbers', [1, 2, 5, 5]);
    });
    
    var as = function(key){
        return (a) => {
			if(a){
				var b = {};
				b[key] = a;
				return b;
			}
        }
    }
    
    var add = function(vals){
        if(vals){
            return [['add', null, as('text')(vals)]];
        }
    }
    
    var second = (__, a) => a;
	var get = (i) => {
		return (a) => {
			if(a && a[i] !== undefined) return a[i];
		}
	}
    
    it('Testing html val set & get', function(){
        var app = Firera({
            __root: {
                $children: {
                    todos: ['list', 'item', {
						add: {
							'../new_todo': as('text'),
						},
                    }],
                },
                $el: ['just', $(".test-input-setget")],
                "foo": [(a) => { console.log('New todo:', a)}, 'new_todo'],
                "new_todo": [second, 'input|press(Enter,Esc)', '-input|getval'],
                "input|setval": [always(''), 'new_todo']
            },
            'item': {
                $init: {
                    text: '',
                    completed: false,
                },
                completed: {
                    '.done|click': true
                }
            }
        })
        
    });
    var logger = (varname, a) => {
        console.log(varname, ':', a);
        return a;
    }
    it('Testing removing from list', function(){
        var $root = $(".test-list-remove");
        var list_sources = {
            add: {
                    '../new_todo': as('text'),
            },
            remove: {
                '*/remove': function(a){
                        if(a && a[0] !== undefined) return a[0];
                }
            },
        }
        var app = Firera({
            __root: {
                $children: {
                    todos: ['list', 'item', {
						$add: [as('text'), '../new_todo'],
						$remove: [function(a){
							if(a && a[0] !== undefined) return a[0];
						}, '*/remove'],
						completed_number: ['count', 'completed']
                    }],
                },
                $el: ['just', $root],
                todos_number: [(a) => {
                    //console.log('Length is', a);
                    return a;
                }, 'todos/$arr_data.length'],
                "new_todo": [second, 'button.add-todo|click', '-input|getval'],
                "input|setval": [always(''), 'new_todo']
            },
            'item': {
                $init: {
                    text: '',
					completed: false,
                    $template: `
						<div class="td-item">
							<input type="checkbox" name="completed" /> - completed
							<div data-fr="text">
							</div>
							<div class="to-right">
								<a href="#" class="remove">Remove</a>
							</div>
							<div class="clearfix"></div>
						</div>
                    `,
                },
				remove: '.remove|click',
                completed: [logger.bind(null, 'checkval'), 'input[type=checkbox]|getval']
            }
        })
		var add_item = (str = 'ololo') => {
			$root.find('input[type=text]').val(str).change();
			$root.find('button').click();
		}
		add_item();
        assert.equal(app.get('$arr_data.length', 'todos'), 1);
        assert.equal(app.get('completed_number', 'todos'), 0);
		add_item('ol');
		add_item('al');
        assert.equal(app.get('$arr_data.length', 'todos'), 3);
        assert.equal(app.get('completed_number', 'todos'), 0);
		
		$root.find('input[type=checkbox]').click();
        assert.equal(app.get('completed_number', 'todos'), 3);
		
		$root.find('[data-fr=todos] > *:first-child .remove').click();
        assert.equal(app.get('completed_number', 'todos'), 2);
		$root.find('[data-fr=todos] > *:first-child .remove').click();
        assert.equal(app.get('completed_number', 'todos'), 1);
		add_item();
        assert.equal(app.get('completed_number', 'todos'), 1);
        
    });
    
    it('Testing async', function(done){
        var app = Firera({
            __root: {
                b: ['just', 42],
                a: ['async', function(cb, b){
                        setTimeout(() => {
                            //console.log('setting b');
                            cb(b);
                        }, 1);
                }, 'b']
            }
        })
        assert.equal(app.get('a'), undefined);
        setTimeout(() => {
            assert.equal(app.get('a'), 42);
            done();
        }, 10)
    })
	
	it('Casting list as array', function(){
        var $root = $(".test-trains");
		var add_item = () => {
			$root.find('button').click();
		}
		var app = Firera({
			__root: {
				$init: {
					$el: $(".test-trains")
				},
				$children: {
					trains: ['list', 'train', {
						$add: '../add_train',
						$remove: [get(0), '*/remove'],
						arr: ['asArray', ['name']],
					}]
				},
				add_train: ['is', (a) => {return {}}, '.add-train|click'],
			},
			train: {
				$init: {
					$template: `
						<div>Some train</div>
						<input> - enter name
						<div><a href="#" class="remove">Del</a></div>
					`
				},
				name: 'input|getval',
				remove: '.remove|click',
			}
		})
		add_item();
		add_item();
		assert.equal(app.get('arr', 'trains').length, 2);
		
		$root.find('[data-fr=trains] > *:first-child .remove').click();
		assert.equal(app.get('arr', 'trains').length, 1);
		
		var inp = $root.find('[data-fr=trains] > *:first-child input');
		inp.val('ololo').keyup();
		assert.deepEqual(app.get('arr', 'trains'), [{
				name: 'ololo'
		}]);
	})
	
	it('$datasource', function(){
		var app = Firera({
			__root: {
				$children: {
					people: ['list', 'human', {
						$datasource: '../people',
						people: ['asArray', ['name', 'age']]
					}]
				},
				people: ['just', [{
					name: 'Ivan',
					age: 35
				}, {
					name: 'Pylyp',
					age: 93,
				}, {
					name: 'Yavdokha',
					age: 91,
				}]],
			},
			human: {
				
			}
		})
		assert.equal(app.get('$arr_data.length', 'people'), 3);
		
		app.set('people', [{
			name: 'Ivan',
			age: 36
		}, {
			name: 'Pylyp',
			age: 94,
		}, {
			name: 'Yavdokha',
			age: 92,
		}]);
	
		
		assert.deepEqual(app.get('people', 'people'), [{
			name: 'Ivan',
			age: 36
		}, {
			name: 'Pylyp',
			age: 94,
		}, {
			name: 'Yavdokha',
			age: 92,
		}]);
	
		app.set('$arr_data.length', [], 'people');
		assert.equal(app.get('$arr_data.length', 'people'), 0);
	})
})
