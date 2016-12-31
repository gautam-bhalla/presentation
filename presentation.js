d3.presentation = function (json, width, height, containerSelector, color) {
    if (typeof(color) === 'undefined') {
    

        // defaults
        color = d3.scale.linear()
            .domain([-1, 5])
            .range(['hsl(35, 100%, 62%)', 'hsl(35, 64%, 34%)'])
            .interpolate(d3.interpolateHcl);
    }

    var margin = 20;

    d3.json(json, function (error, root) {
        if (error) {
            throw error;
        }

        var focus = undefined;
        var steps = root.children;
        var count = steps.length;

        var container = d3.select(containerSelector).on('click', reset)
            .append('svg').attr('width', width - margin).attr('height', height - margin)
            .append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(1)');

        //Page Title
        container.append('text').attr('class', 'title').attr('y', -height / 3).text("Presentation Demo.");

        //Steps -- Circles will be created and populated according to data-set.
        steps.forEach(function (step, cmp) {

            //Packed circles will be modeled in form of tree.
            var pack = d3.layout.pack()
                .size([width / count + margin, height / count + margin])
                .value(function (item) {
                    return item.size || 1;
                });
            var dec = count % 2 == 0 ? cmp - count / 2 + 0.5 : cmp - Math.floor(count / 2);
            var stepItems = pack.nodes(step);

            //Arrow
            if (cmp != 0) {
                container.append('path')
                    .attr('d', arrow(width / count * (dec - 1) + step.r + margin, 0,
                            width / count * dec - step.r - margin, 0))
                    .style('stroke', color(1))
                    .style('fill', 'none');
            }

            //Inner Circle
            var stepContainer = container.append('g');
            var circle = stepContainer.selectAll('circle')
                .data(stepItems)
                .enter().append('circle')
                .attr('class', function (item) {
                    return item.children ? 'item' : 'item item--leaf';
                })
                .attr('cx', function (item) {
                    return item.x - step.x + width / count * dec;
                })
                .attr('cy', function (item) {
                    return item.y - step.y;
                })
                .attr('r', function (item) {
                    return item.r;
                })
                .style('fill', function (item) {
                    return color(item.depth);
                })
                .on('click', zoomTo);

            //Text in innercircle.
            var texts = stepContainer.selectAll('.label')
                .data(stepItems)
                .enter().append('g')
                .attr('class', 'label')
                .style('display', function (item) {
                    return item.parent === undefined ? 'inline' : 'none';
                })
                .attr('transform', function (item) {
                    return 'translate('
                        + (item.x - step.x + width / count * dec) + ','
                        + (item.y - step.y) + ')';
                });

            // Title
            texts.append('text')
                .attr('class', 'subtitle')
                .attr('y', function (item) {
                    if (item.desc) {
                        if (item.start && item.end) {
                            return -20;
                        } else {
                            return -5;
                        }
                    }
                    return 0;
                })
                .text(function (item) {
                    return item.name;
                });

            // Description
            texts.filter(function (item) {
                return item.desc
            })
                .append('text')
                .attr('y', function (item) {
                    if (item.start && item.end) {
                        return 0;
                    }
                    return 5;
                })
                .text(function (item) {
                    return item.desc;
                });

            // Date
            texts.filter(function (item) {
                return item.start && item.end
            })
                .append('text')
                .attr('y', '20')
                .text(function (item) {
                    return item.start + ' - ' + item.end;
                });
        });


        // Zoom Event Handler.
        function zoomTo() {
            var item = d3.select(this);
            focus = item.datum();
            var dx = parseInt(item.attr('cx'));
            var dy = parseInt(item.attr('cy'));
            var r = parseInt(item.attr('r'));

            transform(dx, dy, 0.4 * height / r);
            d3.event.stopPropagation();
        }

        //Reset to normal view.
        function reset() {
            if (focus !== undefined) {
                focus = undefined;
                transform(0, 0, 1);
            }
            d3.event.stopPropagation();
        }


        //Animation and zoom logic.
        function transform(x, y, scale) {
            var translate = [width / 2 - scale * x, height / 2 - scale * y];

            container.transition().duration(750)
                .attr('transform', 'translate(' + translate + ')scale(' + scale + ')')
                .selectAll('.label')
                .each('start', function (item) {
                    if (item.parent !== focus || item.parent === undefined) {
                        this.style.display = 'none';
                    }
                })
                .each('end', function (item) {
                    if (item.parent === focus) {
                        this.style.display = 'inline';
                    }
                })
                .selectAll('text')
                .style('font-size', (15 / scale) + 'px');
        }


        //Arrow Alignment
        function arrow(x1, y1, x2, y2) {
            return 'M' + x1 + ' ' + (y1 + 2) + ' ' +
                'L' + (x2 - 12) + ' ' + (y2 + 2) + ' ' +
                'L' + (x2 - 16) + ' ' + (y2 + 16) + ' ' +
                'L' + x2 + ' ' + y2 + ' ' +
                'L' + (x2 - 16) + ' ' + (y2 - 16) + ' ' +
                'L' + (x2 - 12) + ' ' + (y2 - 2) + ' ' +
                'L' + x1 + ' ' + (y1 - 2) + ' Z';
        }
    });
};
