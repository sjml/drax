# Markdown

This introduction to Markdown is aimed at writers who are used to using something like Microsoft Word or Google Docs, and assumes that, for the most part, you are writing prose. This does not cover all the different ways to use Markdown, but should give you the basic understanding you need to get going. 

Note that Drax's built-in toolbar is also there to help you, so don't worry about memorizing any of this information; this is more of a reference. 

(This page itself was written in Markdown! If you want to see the raw file, [check it out](https://raw.githubusercontent.com/sjml/drax/master/src/assets/pages/markdown.md).)

## Introduction
When you create and edit files in Drax, they are in a format called "Markdown." It takes a little getting used to, but after just a little while it becomes second-nature. In the long run you may end up preferring its more streamlined approach, since you end up thinking more about your words than how they look.

Markdown files are plain text files, which means they can be easily created and read by any computer. If you've ever written in Notepad on Windows or TextEdit on the Mac, you'll be familiar with this. In the olden days of the internet, almost everything was plain text, but people found ways to get their points across. They would put stars around words to indicate emphasis, like &#42;this&#42;. They would make sections and headers by putting # characters in front of words or drawing a row of dashes under them. 

Markdown takes these conventions and formalizes them a little bit. This means that while a Markdown file is perfectly readable on its own, it can also be fed into a computer program that makes it into an attractive web page. 

In Markdown you don't have control over things like font size or color; those are for the designer to figure out. You indicate what parts of the text are supposed to mean, and focus on your words. As a writer, it's very freeing to not have to fiddle with getting it to look good. 

If anything below is confusing and you want to try something out, you can use the [CommonMark website's interactive sandbox](http://spec.commonmark.org/dingus/) to see how your text would get turned into a web page. It won't show any custom colors or layout, just the basic shape of the text. CommonMark also has a [handy cheat sheet](http://commonmark.org/help/) if you need a quick reference.


## Organization

For the most part, you can organize your text the same way you always have. One thing to be aware of, though, is that you need to put a full empty line between paragraphs (instead of just indenting). 

You can make headings by putting a `#` character at the beginning of a line; if you include multiple `#` symbols, you create a sub-heading. For example, the word "Organization" at the top of this section was written as `## Organization` in the Markdown file used to make this webpage. It's a level-2 heading (with the "Markdown" at the top of the page being level-1), so its line starts with `##`. (The "Separators" heading, below this, starts with `###` because it's a level-3 heading.)

In Drax, when you start a line with a `#` symbol, it will resize itself to show you that it's a heading.

### Separators

If you want to put a horizontal line to separate sections more visibly, you just type a line of text that consists of nothing but stars or dashes. So long as you have at least three (that is, either `***` or `---`), it will work. There's a line right below this section to set it off from the next section. 

---

## Formatting

To make things **bold** or _italic_, you have some options in Markdown. Basically, you surround the text you care about with asterisks or underscores; one of them will make it _italic_, two of them will make it **bold**. 

So you can say `__this__` to make your text look like __this__, OR `**this**` to get the same effect. If you only use one special character, `*like so*`, then your text will look like *this*. 

Even though Markdown differentiates based off the number, it can be helpful to associate one of the characters with bold and one with italics. Because italics are often used where older typewritten material used to use underline, it's common to use the underscore for italic text, which leaves the asterisk for bold. The toolbar in Drax assumes that you're using two asterisks (`**`) to create bold text and a lone underscore (`_`) to make italics.

Many versions of Markdown support strikethrough text by surrounding it with two tildes (`~~`). Drax supports this, but you may want to check with your technical people to see if your particular flavor of Markdown does. 

### Links

Since Markdown is used for writing web pages, of course you can use it to link to other pages. You put your "link text," the part that will appear as clickable to your reader, in brackets, `[ ]`, then immediately follow it with your link in parentheses `( )`. So you would could create `[a link to Google](https://google.com)`, and it would show up as [a link to Google](https://google.com). 

(This particular syntax can be hard to remember at first. "Which one is the brackets and which the parentheses? Which one comes first again?" You can always use the toolbar to generate a link if you forget!)


### Images

Images are one of the places where Markdown stumbles a little bit. You can put them into your writing, but you don't have a lot of control over how they'll appear. They also have to already exist somewhere on the web, which means you'll either need some kind of web hosting or be willing to mooch off other people's goodwill. Talk to your technical people or editors if you have questions on this. 

In the meanwhile, the magical incantation that makes images appear is pretty similar to links. You just add an exclamation point in front of it, and what would have been the visible link text will instead be a description that certain web browsers will use to describe the image (for the visually impaired, for instance). 

So, I can type `![a charming but lonely looking bear](https://placebear.com/290/250)` to get the following in my final document: 

![a charming but lonely looking bear](https://placebear.com/290/250)

(Note there are some modifications to Markdown that **do** let you control the image's position on the page; Drax doesn't use them, but ask your editors or techies if you need that.)

### Lists

There are two kinds of lists you can make in Markdown, bulleted and numbered. 

To make a bulleted list, put a `*` or `-` character at the start of a line, followed by a space. 

```
* First Item
* Second Item
* Third Item
```

Will show up like this: 

* First Item
* Second Item
* Third Item

To do a numbered list is very similar, but you put a number at the start of the line, followed by either a period or a close parenthesis. So you can say either:

```
1. One
2. Two
3. Three
```

**OR**

```
1) One
2) Two
3) Three
```

And it will become: 

1. One
2. Two
3. Three

Note that the actual order of the numbers you put in doesn't matter; the numbers that get output will always be in order and always start from 1. 


### Blockquotes

To set off a section as an extended quote or pull quote, put a `>` followed by a space at the beginning of the line. There's a lot of variation in how this actually looks on your final page, but typically it involves changes to indentation, font size and color, etc. Talk to your designer if you have questions. 


### Monospacing

Most of the time when you're writing prose, you want to use what's called a _proportional_ font, which means that the letters have different widths; this is more pleasing to the eye when reading large passages. Sometimes, though, you may want to make certain words or passages have the "typewriter" look, where a lowercase letter "i" has the same width as a lowercase letter "m." Fonts that look this way are called "monospace," and you can get them into your Markdown document by using backticks. 

So in this sentence, the word `code` was actually written as <code>&#96;code&#96;</code>. (Throughout this guide, I've been using the monospaced formatting to show the "raw" Markdown code; note the difference between the first and second monospace stretches in that sentence!)

---

## Advanced Usage

If you have some special bit of formatting that Markdown doesn't cover, you can always write raw HTML and it will work just fine. Learning HTML is beyond the scope of this document; rest assured there are plents of books and websites to teach you what you need to know. 

We've covered the standard uses of Markdown that most writers of prose will need, but there are some more advanced features that we haven't covered. You can read the [original Markdown syntax description](https://daringfireball.net/projects/markdown/syntax) or try [CommonMark's interactive tutorial](http://commonmark.org/help/tutorial/) if you want to level up your skills a bit. 

Good luck, and have fun! 
