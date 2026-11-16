// File: assets/js/company-sync.js

function createElement(tag, text = null) {
  const element = document.createElement(tag);

  if (text !== null && text !== undefined) {
    element.textContent = String(text);
  }

  return element;
}

function getHeadingKey(heading) {
  const copy = heading.cloneNode(true);

  copy.querySelectorAll('.jp').forEach(function (label) {
    label.remove();
  });

  return copy.textContent
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function findDataCell(table, key) {
  const rows = Array.from(table.rows);

  for (const row of rows) {
    const heading = row.querySelector('th');
    const cell = row.querySelector('td');

    if (heading && cell && getHeadingKey(heading) === key) {
      return cell;
    }
  }

  return null;
}

function getDivisionName(division) {
  return division.name.replace(/部門$/, '');
}

function createTalentContent(activeTalents, divisions) {
  const fragment = document.createDocumentFragment();

  fragment.append(
    createElement('strong', `${activeTalents.length}名`),
    document.createTextNode('（現所属）'),
    document.createElement('br')
  );

  const descriptions = divisions.map(function (division) {
    const count = activeTalents.filter(function (talent) {
      return talent.primaryDivision === division.id;
    }).length;

    const name = getDivisionName(division);

    if (division.id === 'actor') {
      return `${name}${count}名（舞台・声優活動を行う所属者を含む）`;
    }

    return `${name}${count}名`;
  });

  descriptions.forEach(function (description, index) {
    fragment.append(document.createTextNode(description));

    if (index < descriptions.length - 1) {
      if ((index + 1) % 2 === 0) {
        fragment.append(document.createElement('br'));
      } else {
        fragment.append(document.createTextNode('／'));
      }
    }
  });

  fragment.append(
    document.createElement('br'),
    document.createTextNode(
      '※各人の主所属部門で集計し、重複計上していません。'
    )
  );

  return fragment;
}

function createDivisionContent(activeTalents, divisions) {
  const fragment = document.createDocumentFragment();

  const activeDivisions = divisions.filter(function (division) {
    return activeTalents.some(function (talent) {
      return talent.primaryDivision === division.id;
    });
  });

  fragment.append(
    createElement('strong', `${activeDivisions.length}部門`),
    document.createElement('br'),
    document.createTextNode(
      activeDivisions.map(getDivisionName).join('／')
    )
  );

  return fragment;
}

async function initializeCompanySync() {
  const table = document.querySelector(
    '.company-data .data-table'
  );

  if (!table) {
    return;
  }

  try {
    const { talents, divisions } = await import('./data/talents.js');

    const activeTalents = talents.filter(function (talent) {
      return talent.status === 'active';
    });

    const talentsCell = findDataCell(table, 'TALENTS');
    const divisionsCell = findDataCell(table, 'DIVISIONS');

    if (!talentsCell || !divisionsCell) {
      console.warn(
        '会社概要の自動更新対象が見つかりません。既存の表示を維持します。'
      );
      return;
    }

    /*
     * データと更新対象の確認が済んでから反映。
     * 読み込み失敗時は、HTMLに記載された内容を維持する。
     */
    const talentContent = createTalentContent(
      activeTalents,
      divisions
    );

    const divisionContent = createDivisionContent(
      activeTalents,
      divisions
    );

    talentsCell.replaceChildren(talentContent);
    divisionsCell.replaceChildren(divisionContent);
  } catch (error) {
    console.error(
      '会社概要の自動集計に失敗しました。既存の表示を維持します。',
      error
    );
  }
}

initializeCompanySync();