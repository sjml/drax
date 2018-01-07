/* tslint:disable */

import { Schema, Node } from 'prosemirror-model';


export const schema = new Schema({
  nodes: {
    doc: {
      content: "block+"
    },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{tag: "p"}],
      toDOM: function toDOM() { return ["p", 0] }
    },

    blockquote: {
      content: "block+",
      group: "block",
      parseDOM: [{tag: "blockquote"}],
      toDOM: function toDOM() { return ["blockquote", 0] }
    },

    horizontal_rule: {
      group: "block",
      parseDOM: [{tag: "hr"}],
      toDOM: function toDOM() { return ["div", ["hr"]] }
    },

    heading: {
      attrs: {level: {default: 1}},
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [{tag: "h1", attrs: {level: 1}},
                 {tag: "h2", attrs: {level: 2}},
                 {tag: "h3", attrs: {level: 3}},
                 {tag: "h4", attrs: {level: 4}},
                 {tag: "h5", attrs: {level: 5}},
                 {tag: "h6", attrs: {level: 6}}],
      toDOM: function toDOM(node) { return ["h" + node.attrs.level, 0] }
    },

    code_block: {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      attrs: {params: {default: ""}},
      parseDOM: [{tag: "pre", preserveWhitespace: true, getAttrs: function (node) {
                                                              if (typeof node === 'string') {
                                                                return {};
                                                              }
                                                              else return {
                                                                params: node.attributes.getNamedItem("data-params")
                                                              };
                                                            }
                }],
      toDOM: function toDOM(node) { return ["pre", node.attrs.params ? {"data-params": node.attrs.params} : {}, ["code", 0]] }
    },

    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: {order: {default: 1}, tight: {default: false}},
      parseDOM: [{tag: "ol", getAttrs: function getAttrs(dom) {
        if (typeof dom === 'string') {
          return {};
        }
        else {
        return {order: dom.attributes.getNamedItem("start") !== null ? +dom.attributes.getNamedItem("start") : 1,
                tight: dom.attributes.getNamedItem("data-tight") !== null}
        }
      }}],
      toDOM: function toDOM(node) {
        return ["ol", {start: node.attrs.order == 1 ? null : node.attrs.order,
                       "data-tight": node.attrs.tight ? "true" : null}, 0]
      }
    },

    bullet_list: {
      content: "list_item+",
      group: "block",
      attrs: {tight: {default: false}},
      parseDOM: [{tag: "ul", getAttrs: function (dom) {
                                          if (typeof dom === 'string') {
                                            return {};
                                          }
                                          else {
                                            return {tight: dom.attributes.getNamedItem("data-tight") !== null};
                                          }
                                        }
                }],
      toDOM: function toDOM(node) { return ["ul", {"data-tight": node.attrs.tight ? "true" : null}, 0] }
    },

    list_item: {
      content: "paragraph block*",
      defining: true,
      parseDOM: [{tag: "li"}],
      toDOM: function toDOM() { return ["li", 0] }
    },

    text: {
      group: "inline",
      toDOM: function toDOM(node) { return node.text }
    },

    image: {
      inline: true,
      attrs: {
        src: {},
        alt: {default: null},
        title: {default: null}
      },
      group: "inline",
      draggable: true,
      parseDOM: [
        {
          tag: "img[src]",
          getAttrs: function getAttrs(dom) {
                                if (typeof dom === 'string') {
                                  return {};
                                }
                                else return {
                                    src: dom.attributes.getNamedItem("src"),
                                    title: dom.attributes.getNamedItem("title"),
                                    alt: dom.attributes.getNamedItem("alt")
                                  }
                                }
        }
      ],
      toDOM: function toDOM(node) { return ["img", node.attrs] }
    },

    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{tag: "br"}],
      toDOM: function toDOM() { return ["br"] }
    }
  },

  marks: {
    em: {
      parseDOM: [{tag: "i"}, {tag: "em"},
                 {style: "font-style", getAttrs: function (value) { return value == "italic" && null; }}],
      toDOM: function toDOM() { return ["em"] }
    },

    strong: {
      parseDOM: [{tag: "b"}, {tag: "strong"},
                 {style: "font-weight", getAttrs: function (value) {
                                          if (typeof value === 'string') {
                                            return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null;
                                          }
                                          else return {};
                                        }
                 }
                ],
      toDOM: function toDOM() { return ["strong"] }
    },

    link: {
      attrs: {
        href: {},
        title: {default: null}
      },
      inclusive: false,
      parseDOM: [{tag: "a[href]", getAttrs: function getAttrs(dom) {
                                                        if (typeof dom === 'string') {
                                                          return {};
                                                        }
                                                        else return {
                                                          href: dom.attributes.getNamedItem("href"),
                                                          title: dom.attributes.getNamedItem("title")
                                                        }
      }}],
      toDOM: function toDOM(node) { return ["a", node.attrs] }
    },

    code: {
      parseDOM: [{tag: "code"}],
      toDOM: function toDOM() { return ["code"] }
    },

    strikethrough: {
      parseDOM: [{tag: "s"}],
      toDOM: function toDOM() { return ["s"] }
    }
  }
});
