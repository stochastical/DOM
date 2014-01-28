
( function() {
	'use strict';

	var linksCollection;
	var popupObj;			// кешируем всё дерево в рамках модуля
	var popupTree = {		// описание дерева объектов для построения попапа
		tag:'div', className1:'popup', className2:'container', childs: [
			{ tag:'div', className1:'curtain' , childs:
			{ tag:'div', className:'form', childs: [
				{ tag:'span', className:'title', id:'popup_title', text:"" },
				{ tag:'br' },
				{ tag:'span', className:'message', id:'popup_message', text:"" },
				{ tag: 'div', childs: [
					{ tag:'button', className:'popup_cancel', text:'Отмена',  },
					{ tag:'button', className:'popup_OK', autofocus:'autofocus', text:'ОК' }
					]
				}
				]
			}
			}
		]
	};


	/**
	 * Обработчик клика по ссылке с классом 'popup-link'
	 * @param {Event} e событие клика
	 * @private
	 */
	function _onMouseClick(e) {
		e = e || window.event;
		if (e.preventDefault) 
			e.preventDefault();
		else 
			e.returnValue = false;
		if (this.classList.contains('popup-link'))				// проверка, а то ли мы обрабаываем. Нужно ли?
			openPopupFromLink(this);
		return false;
	}

	/**
	 * Получает данные из ссылки
	 * на основе этих данных создаёт попап (через createPopup) и добавляет его в DOM
	 * @param {HTMLElement} link Ссылка с data-аттрибутами
	 */
	function openPopupFromLink(link) {

		function redirector() {
			//console.log("Redirecting to "+url);
			hidePopup();
			window.location.assign(url);
		}

		var url = link.href || "";
		var title = link.dataset.title || "Переход на внешний ресурс"; 	// Значения по умолчанию. 
		var msg = link.dataset.message || "Перейти по ссылке: \"%s\"?";	// Их существование не оговаривалось.
		msg = msg.replace("%s", url, "gm");
		createPopup(title, msg, redirector);
		return false;
	}



	/**
	 * Создаёт DOM-узел с сообщением
	 * @param {String} title Заголовок сообщение
	 * @param {String} message Текст сообщения сообщение
	 * @param {Function} onOk Обработчик клика по кнопке 'Да'
	 * @returns {HTMLElement}
	 */
	function createPopup(title, message, onOk) {
		if (popupObj === undefined) {
			popupObj = { 
				node : BuildTree(document.createDocumentFragment(), popupTree)
			};
			setEventListener(popupObj.node.getElementsByClassName('popup_cancel')[0], 'click', hidePopup);
			popupObj.okButton = popupObj.node.getElementsByClassName('popup_OK')[0];
			popupObj.title = popupObj.node.getElementsByClassName('title')[0].firstChild;
			popupObj.message = popupObj.node.getElementsByClassName('message')[0].firstChild;
			
		}
		popupObj.onOkHandler = onOk;
		setEventListener(popupObj.okButton, 'click', onOk);
		popupObj.title.textContent = title;
		popupObj.message.textContent = message;
		document.body.appendChild(popupObj.node);
		popupObj.okButton.focus();
		
	}

	/**
	 *  Удаляем DOM-узел с сообщением
	 */
	function hidePopup() {
		if ( (popupObj !== undefined) && (popupObj.node instanceof Element) && 
			((popupObj.node.parentNode instanceof Element))) {
				unsetEventListener(popupObj.okButton, 'click', popupObj.onOkHandler);
				popupObj.node.parentNode.removeChild(popupObj.node);
		}
	}

	/**
	 * Прикрепляет обработчик клика к ссылкам с классом 'popup-link' 
	 * Живая коллекция ссылок кешируется в рамках модуля
	 * @param {Event} e событие клика
	 */
	function setupHandlers(e) {
		var i;
		e = e || window.event;
		if (linksCollection === undefined) linksCollection = document.getElementsByClassName('popup-link'); 
		for ( i=0; i<linksCollection.length; i++ ) {
			setEventListener(linksCollection[i], "click", _onMouseClick);
		}
	}


	/**
	 * Строит HTML дерево с заданной структурой
	 * @param {HTMLElement} Parent Корневой объект, к которому будет прикреплено дерево
	 * @param {String} Skel Описание структуры дерева
	 * @returns {HTMLElement} Возвращает в данном случае корневой элемент дерева
	 */
	function BuildTree(Parent, Skel) {

		function SetField(El, Name, Value) {
			if ( (typeof Value == 'string') || (typeof Value == 'number') || 
				(typeof Value == 'function') ){		// свойство или событие устанавливаем
					if (Name.search("className") === 0)
						El.classList.add(Value);
					else
						El[Name] = Value;
			} else {
				for (var item in Value) {			// а иначе устанавливаем свойства рекурсивно (для style)
					if (Value.hasOwnProperty(item))
						SetField(El[Name], item, Value[item] );
				}
			}
		}

		var attr;
		var el;
		if (! Parent instanceof Element) return null;
		if (Skel instanceof Array) {
			for (var i=0; i<Skel.length; i++) {
				BuildTree(Parent,Skel[i]);
			}
		} else {
			if (Skel.tag && Skel.tag.length) {
				el = window.document.createElement(Skel.tag);
				delete Skel.tag;
				if (Skel.text != undefined) {
					el.appendChild( window.document.createTextNode(Skel.text) );
					delete Skel.text;					// to not filter this
				}
			} else {
				if (Skel.text != undefined) {
					Parent.appendChild( window.document.createTextNode(Skel.text) );
					// delete Skel.text;					// to not filter this
				}
				return null;							// if text node (or even there is no text) we just exit
			}											// there is no properties in text node
			for (attr in Skel) {
				if ( (Skel.hasOwnProperty(attr)) && (attr != 'childs') ) {	// если свойства не из прототипа
					SetField(el, attr, Skel[attr]);						// то добавляем их в узел
				}
			}
			if (Skel.childs)
				BuildTree(el, Skel.childs);

			Parent.appendChild(el);					
		}
		return el;
	}

	/**
	 * Прикрепляет обработчик события к объекту
	 * @param {HTMLElement} obj объект
	 * @param {String} eventName Имя события
	 * @param {Function} handler Обработчик события
	 */
	function setEventListener(obj, eventName, handler) {
		if (! obj) return null;
		if (obj.addEventListener) obj.addEventListener(eventName, handler, false);
		if (obj.attachEvent) obj.attachEvent("on"+eventName, handler);
	}

	function unsetEventListener(obj, eventName, handler) {
		if (! obj) return null;
		if (obj.removeEventListener) obj.removeEventListener(eventName, handler, false);
		if (obj.detachEvent) obj.detachEvent("on"+eventName, handler);
	}

	/**
	 * Когда страница загружена прикрепляем обработчики
	 */
	setEventListener(window, "load", setupHandlers);


/*
         <div class="vcard sign">
                <span class="title">Автор</span>:
                <span class="fn nickname">Фурсенко Александр</span>
                (<span class="email">syngularity@yandex.ua</span>)
        </div>
*/

}() );