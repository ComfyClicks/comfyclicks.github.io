const results = document.querySelector('#results');
const tabList = results.querySelector('[role="tablist"]');
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const metrics = [...panels[0].querySelectorAll('.metric-chart')].map(chart => ({
  title: chart.querySelector('h3').textContent,
  rows: [...chart.querySelectorAll('.metric-device')].map(device => {
    const label = device.querySelector('h4').firstChild.textContent.trim();
    const [before, after] = [...device.querySelectorAll('.metric-value')].map(value => value.textContent);
    const initial = parseFloat(before.replaceAll(',', ''));
    const final = parseFloat(after.replaceAll(',', ''));
    return { label, before, after, change: (final - initial) / initial * 100 };
  }),
}));

const formatChange = new Intl.NumberFormat('en', {
  style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero',
});

const largestChange = Math.max(...metrics.flatMap(metric => metric.rows.map(row => Math.abs(row.change))));
const scale = Math.ceil(largestChange / 10) * 10;
const plot = element('div', '', 'change-plot');
const axis = element('div', '', 'change-axis');
axis.setAttribute('aria-hidden', 'true');
const ticks = element('div', '', 'change-ticks');
ticks.append(element('span', `−${scale}%`), element('span', '0%'), element('span', `+${scale}%`));
axis.append(ticks);
plot.append(axis);
panels[1].append(plot);

for (const metric of metrics) {
  const group = element('article', '', 'change-group');
  const rows = element('dl', '', 'change-rows');
  group.append(element('h3', metric.title), rows);
  for (const row of metric.rows) {
    const entry = element('div', '', 'change-row');
    const value = element('dd');
    const track = element('span', '', 'change-track');
    const dot = element('span', '', 'change-dot');
    track.setAttribute('aria-hidden', 'true');
    dot.style.setProperty('--dot-position', `${50 + row.change / (2 * scale) * 100}%`);
    track.append(dot);
    value.append(track, element('span', formatChange.format(row.change / 100), 'change-value'));
    entry.append(element('dt', row.label), value);
    rows.append(entry);
  }
  plot.append(group);
}

const table = element('table', '', 'results-table');
table.setAttribute('aria-label', 'Before and after by metric and device');
const heading = table.createTHead().insertRow();
for (const label of ['Metric', 'Before', 'After']) {
  const header = element('th', label);
  header.scope = 'col';
  heading.append(header);
}
const body = table.createTBody();
for (const metric of metrics) {
  for (const row of metric.rows) {
    const entry = body.insertRow();
    const name = element('th', metric.title);
    name.scope = 'row';
    name.append(element('span', row.label, 'results-table-device'));
    entry.append(name, element('td', row.before), element('td', row.after));
  }
}
const tableFrame = element('div', '', 'results-table-frame');
tableFrame.append(table);
panels[2].append(tableFrame);

function activateTab(index) {
  tabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[position].hidden = !selected;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(index));
  tab.addEventListener('keydown', event => {
    const next = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tab.tabIndex = -1;
    tabs[next].tabIndex = 0;
    tabs[next].focus();
  });
  panels[index].tabIndex = 0;
});

tabList.addEventListener('focusout', event => {
  if (tabList.contains(event.relatedTarget)) return;
  tabs.forEach(tab => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  });
});

panels[0].setAttribute('role', 'tabpanel');
panels[0].setAttribute('aria-labelledby', tabs[0].id);
tabList.hidden = false;
