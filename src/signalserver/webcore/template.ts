import * as fs from 'fs';
import * as path from 'path';
import Mem from './memory';
import { Feedback } from './feedback';

//http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
// var template =
// 'My skills:' +
// '<%if(this.showSkills) {%>' +
// '<%for(var index in this.skills) {%>' +
// '<a href="#"><%this.skills[index]%></a>' +
// '<%}%>' +
// '<%} else {%>' +
// '<p>none</p>' +
// '<%}%>';

// console.log(TemplateEngine.create(template, {
// skills: ["js", "html", "css"],
// showSkills: true
// }));

export class TemplateEngine {
    private static readonly re: RegExp = /<%([^%>]+)?%>/g;
    private static readonly reExp: RegExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g;

    private static add = (line: string, js?: Boolean): string => {
        if (js) {
            if (line.match(TemplateEngine.reExp))
                return line + '\n';

            return 'r.push(' + line + ');\n';
        }

        if (line != '')
            return 'r.push("' + line.replace(/"/g, '\\"') + '");\n';

        return '';
    }

    public static create = (html: string, options: object): string => {
        let code: string = 'var r=[];\n';
        let cursor: number = 0;
        let match: RegExpExecArray;

        while (match = TemplateEngine.re.exec(html)) {
            code += TemplateEngine.add(html.slice(cursor, match.index));
            code += TemplateEngine.add(match[1], true);
            cursor = match.index + match[0].length;
        }

        code += TemplateEngine.add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';

        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
    }
}