import { useMemo } from 'react';

//GroupedAlbums
//dislplayedAlbums -- > 최소 단위가 앨범인가?
//useGroupedAlbums는 앨범들을 묶어주는 건가?

export function useGroupedAlbums(displayedAlbums) {
  //useMemo는 복잡한 계산시에 사용한다.
  //react는 계속 랜더링을 하기 때문에 계산량이 많아진다
  //useMemo는 지정한 값이 변경된 경우에만 랜더링을 한다.
  return useMemo(() => {
    const groupedAlbums = [];
    displayedAlbums.forEach(album => {
      if (album.sourceId !== 'standalone') {
        //standalone은 mix에 속하지 않은 앨범이나 아이템인경우이고
        //standalone이 아닌 경우는 믹스에 속한 앨범이나 아이템

        //let은 변수 const는 상수
        let group = groupedAlbums.find(g => g.type === 'mix_group' && g.sourceId === album.sourceId);
        if (!group) {
          //아직 상자가 없으면 만든다. 상자를 만드는 과정.
          group = { type: 'mix_group', sourceId: album.sourceId, items: [] };
          //상자를 만든다 --> type 붙이고, id 붙이고, item 배열에다가 빈배열 넣고
          groupedAlbums.push(group);
        }
        //상자를 만들고 album을 push한다.
        //group에 있는 item안에다가 album을 넣어서 그루핑하는 것
        group.items.push(album);
      } else {
        groupedAlbums.push(album);
      }
    });
    return groupedAlbums;
  }, [displayedAlbums]);
}
