import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

import { DOMParser } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { undo, redo, history } from 'prosemirror-history';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { defaultMarkdownSerializer, MarkdownParser } from 'prosemirror-markdown';

import * as markdownit from 'markdown-it';

import { schema } from './schema';

import { GitHubAccessComponent, GitHubFile } from '../githubaccess/githubaccess.component';
import { GenericEditor } from '../editor/editor.base';

@Component({
  selector: 'app-prose-editor',
  templateUrl: './prose-editor.component.html',
  styleUrls: ['./prose-editor.component.scss']
})
export class ProseEditorComponent extends GenericEditor implements OnInit {

  @ViewChild('proseHost') host: ElementRef;

  parser: MarkdownParser = null;
  @Input() file: GitHubFile = null;
  @Input() ghAccess: GitHubAccessComponent;

  view: EditorView = null;

  constructor() {
    super();
  }

  ngOnInit() {
    const mdit = markdownit('commonmark', {html: false});
    mdit.enable(['strikethrough']);

    this.parser = new MarkdownParser(schema, mdit, {
      blockquote: {block: 'blockquote'},
      paragraph: {block: 'paragraph'},
      list_item: {block: 'list_item'},
      bullet_list: {block: 'bullet_list'},
      ordered_list: {block: 'ordered_list', getAttrs: tok => ({order: +tok.attrGet('order') || 1})},
      heading: {block: 'heading', getAttrs: tok => ({level: +tok.tag.slice(1)})},
      code_block: {block: 'code_block'},
      fence: {block: 'code_block', getAttrs: tok => ({params: tok.info || ''})},
      hr: {node: 'horizontal_rule'},
      image: {node: 'image', getAttrs: tok => ({
        src: tok.attrGet('src'),
        title: tok.attrGet('title') || null,
        alt: tok.children[0] && tok.children[0].content || null
      })},
      hardbreak: {node: 'hard_break'},

      em: {mark: 'em'},
      strong: {mark: 'strong'},
      link: {mark: 'link', getAttrs: tok => ({
        href: tok.attrGet('href'),
        title: tok.attrGet('title') || null
      })},
      code_inline: {mark: 'code'},
      s: {mark: 'strikethrough'}
    });

    let initialString = this.host.nativeElement.innerHTML;
    if (this.file) {
      initialString = this.file.contents;
    }

    const state = EditorState.create({
      doc: this.parser.parse(initialString),
      plugins: [
        history(),
        keymap({'Mod-z': undo, 'Mod-y': redo}),
        keymap(baseKeymap)
      ]
    });
    this.host.nativeElement.innerHTML = '';

    this.view = new EditorView(this.host.nativeElement, {state});

    this.takeFocus();
  }

  takeFocus() {
    this.view.focus();
  }

  toggleBold(): boolean {
    const v = this.view;
    if (this.view.state.selection.empty) {
      const c = this.view.state.selection.$cursor;
      console.log(c.nodeAfter, c.nodeBefore);
      console.log(this.view.endOfTextblock('forward'));
    }
    toggleMark(schema.marks.strong)(this.view.state, this.view.dispatch);
    this.takeFocus();
    return true;
  }

  toggleItalics(): boolean {
    toggleMark(schema.marks.em)(this.view.state, this.view.dispatch);
    this.takeFocus();
    return true;
  }

  toggleCode(): boolean {
    toggleMark(schema.marks.code)(this.view.state, this.view.dispatch);
    this.takeFocus();
    return true;
  }

  toggleStrikethrough(): boolean {
    toggleMark(schema.marks.strikethrough)(this.view.state, this.view.dispatch);
    this.takeFocus();
    return true;
  }



}
